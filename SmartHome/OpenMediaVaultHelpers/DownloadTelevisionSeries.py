import json
import os
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
    with open(filename, "r", encoding="utf8") as f:
        return json.load(f)


def save_episode_details_to_file(filename: str, data):
    with open(filename, "w", encoding="utf8") as f:
        json.dump([d.to_dict() if hasattr(d, "to_dict") else d for d in data], f, ensure_ascii=False, indent=2)


def extract_text_excluding_children(tag):
    # return text directly inside tag, excluding descendant tags' text
    return "".join(t for t in tag.find_all(string=True, recursive=False)).strip()


def main():
    serien_config = read_configuration("./serien.json")
    session = create_session()

    for serie_config in serien_config:
        serie_file_name = serie_config.get("serieFileName")
        if os.path.exists(serie_file_name):
            print(f"Datei {serie_file_name} existiert bereits. Überspringe...")
            continue

        serie_url = BASE_URL + serie_config.get("serienUrl", "")
        episode_guide_url = serie_url + "/episodenguide"

        r = session.get(episode_guide_url)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        episodes = soup.select('[data-event-category="liste-episoden"]')
        episode_details_array = []

        for ep in episodes:
            # In the TS version, the element has an href attribute pointing to details
            details_url = ep.get("href") or ep.get("data-href") or ""

            # immediate child tags (skip text nodes)
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

            print(f"Extracted: {episode_continuous} - {season_episode} - {episode_name}")
            print(f"Download description for {episode_name}")

            details_full_url = (BASE_URL + details_url) if details_url.startswith("/") else details_url
            episode_description = ""
            try:
                episode_description = load_episode_description(session, details_full_url)
            except Exception as e:
                print(f"Failed to load description from {details_full_url}: {e}")

            episode_details_array.append(EpisodeDetails(episode_continuous, season_episode, episode_name, episode_description))

        save_episode_details_to_file(serie_file_name, episode_details_array)


if __name__ == "__main__":
    main()
