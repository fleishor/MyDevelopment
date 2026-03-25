import json
import logging
import os
import sys
import urllib.parse
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://www.fernsehserien.de"

class EpisodeDetails:
    def __init__(self, episode_continuous: str, season_episode: str, episode_name: str, episode_description: str):
        self.episodeContinuous = episode_continuous
        self.seasonEpisode = season_episode
        self.episodeName = episode_name
        self.episodeDescription = episode_description

    def to_dict(self):
        return {
            "episodeContinuous": self.episodeContinuous,
            "seasonEpisode": self.seasonEpisode,
            "episodeName": self.episodeName,
            "episodeDescription": self.episodeDescription,
        }

def create_session(retries: int = 3, backoff_factor: float = 1.0) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "POST"),
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def load_episode_description(session: requests.Session, episode_description_url: str) -> str:
    if not episode_description_url:
        return ""
    r = session.get(episode_description_url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    el = soup.select_one('.episode-output-inhalt-inner')
    return el.get_text(strip=True) if el else ""

def read_configuration(filename: str):
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)

def save_episode_details_to_file(filename: str, data):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump([d.to_dict() if hasattr(d, "to_dict") else d for d in data], f, ensure_ascii=False, indent=2)

def extract_text_excluding_children(tag):
    # return text directly inside tag, excluding descendant tags' text
    return "".join(t for t in tag.find_all(string=True, recursive=False)).strip()

def sanitize_filename(filename: str) -> str:
    # Remove or replace Windows-illegal characters
    illegal_chars = '<>:"/\\|?*'
    for char in illegal_chars:
        filename = filename.replace(char, '_')
    return filename

def main():
    if len(sys.argv) != 2:
        print("Usage: python DownloadTelevisionSeries.py <json_filename>")
        sys.exit(1)
    
    json_filename = sys.argv[1]
    logging.basicConfig(level=logging.INFO)
    logging.info("Starting processing")
    
    serien_config = read_configuration(json_filename)
    session = create_session()
    
    for serie_config in serien_config:
        serien_url = serie_config.get("serienUrl")
        serie_file_name = serie_config.get("serieFileName")
        sanitized_filename = sanitize_filename(serie_file_name)
        output_path = os.path.join("output", f"{sanitized_filename}")
        
        if os.path.exists(output_path):
            logging.info(f"File {output_path} already exists. Skipping...")
            continue
        
        episode_guide_url = urllib.parse.urljoin(BASE_URL, serien_url + "/episodenguide")
        
        try:
            r = session.get(episode_guide_url)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "html.parser")
        except Exception as e:
            logging.error(f"Failed to fetch {episode_guide_url}: {e}")
            continue
        
        episodes = soup.select('[data-event-category="liste-episoden"]')
        episode_details_array = []
        
        for ep in episodes:
            details_url = ep.get("href") or ep.get("data-href") or ""
            
            children = [c for c in ep.find_all(recursive=False) if getattr(c, 'name', None)]
            
            episode_continuous = ""
            season_episode = ""
            episode_name = ""
            
            if len(children) > 1:
                episode_continuous = extract_text_excluding_children(children[1])
                b_elem = children[1].select_one("span > b")
                season_episode = b_elem.get_text(strip=True) if b_elem else ""
            
            if not season_episode:
                season_episode = "00.00"
                episode_continuous = "999"
            
            if len(children) > 6:
                name_span = children[6].select_one("span[itemprop='name']")
                episode_name = name_span.get_text(strip=True) if name_span else ""
            
            logging.info(f"Extracted: {episode_continuous} - {season_episode} - {episode_name}")
            logging.info(f"Download description for {episode_name}")
            
            details_full_url = urllib.parse.urljoin(BASE_URL, details_url)
            episode_description = ""
            try:
                episode_description = load_episode_description(session, details_full_url)
            except Exception as e:
                logging.error(f"Failed to load description from {details_full_url}: {e}")
            
            episode_details_array.append(EpisodeDetails(episode_continuous, season_episode, episode_name, episode_description))
        
        save_episode_details_to_file(output_path, episode_details_array)
        logging.info(f"Completed processing for {serie_file_name}")

if __name__ == "__main__":
    main()
