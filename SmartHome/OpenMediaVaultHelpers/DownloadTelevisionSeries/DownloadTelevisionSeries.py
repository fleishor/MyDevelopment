import json
import logging
import os
import sys
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.fernsehserien.de/"


def fetch_html(url):
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    response.raise_for_status()
    return response.text


def load_episode_description(episode_url):
    if not episode_url:
        return ""
    soup = BeautifulSoup(fetch_html(episode_url), "html.parser")
    description = soup.select_one(".episode-output-inhalt-inner")
    return description.get_text(strip=True) if description else ""


def read_configuration(filename):
    with open(filename, "r", encoding="utf-8") as config_file:
        return json.load(config_file)


def sanitize_filename(filename):
    illegal_chars = '<>:"/\\|?*'
    sanitized = "".join("_" if char in illegal_chars else char for char in filename)
    sanitized = sanitized.rstrip(" .")
    return sanitized or "series"


def metadata_filename(series_file_name):
    sanitized_name = sanitize_filename(series_file_name)
    if not sanitized_name.lower().endswith(".json"):
        sanitized_name += ".json"
    return sanitized_name


def episode_key(episode):
    return (
        episode.get("episodeContinuous", ""),
        episode.get("seasonEpisode", ""),
    )


def extract_episodes(html, episode_guide_url):
    soup = BeautifulSoup(html, "html.parser")
    episode_nodes = soup.find_all(attrs={"data-event-category": "liste-episoden"})
    episodes = []

    for episode_node in episode_nodes:
        children = [child for child in episode_node.children if getattr(child, "name", None)]
        episode_continuous = ""
        season_episode = ""
        episode_name = ""
        if len(children) > 1:
            episode_continuous = "".join(
                str(text) for text in children[1].find_all(string=True, recursive=False)
            ).strip()
            bold_episode = children[1].select_one("span > b")
            if bold_episode:
                season_episode = bold_episode.get_text(strip=True)

        if not season_episode:
            episode_number_node = children[1]
            if episode_number_node:
                episode_number = episode_number_node.get_text(strip=True)
                season_episode = "00." + episode_number.zfill(2)
                episode_continuous = episode_number

        if not season_episode:
            season_episode = "00.00"
            episode_continuous = "999"

        if len(children) > 6:
            name_node = children[6].select_one('span[itemprop="name"]')
            if name_node:
                episode_name = name_node.get_text(strip=True)

        details_url = episode_node.get("href") or episode_node.get("data-href", "")
        episode = {
            "episodeContinuous": episode_continuous,
            "seasonEpisode": season_episode,
            "episodeName": episode_name,
            "episodeDescription": "",
        }
        episodes.append((episode, urljoin(episode_guide_url, details_url) if details_url else ""))

    return episodes


def update_metadata_file(filename, new_episodes):
    if os.path.exists(filename):
        try:
            with open(filename, "r", encoding="utf-8") as metadata_file:
                existing_episodes = json.load(metadata_file)
            if not isinstance(existing_episodes, list):
                raise ValueError("metadata must contain a JSON array")
        except (OSError, json.JSONDecodeError, ValueError) as error:
            logging.error("Could not read existing metadata %s: %s", filename, error)
            return
    else:
        existing_episodes = []

    existing_keys = {episode_key(episode) for episode in existing_episodes if isinstance(episode, dict)}
    additions = []
    for episode, episode_url in new_episodes:
        key = episode_key(episode)
        if key in existing_keys:
            logging.info(
                "Already found episode: %s - %s - %s",
                episode["episodeContinuous"],
                episode["seasonEpisode"],
                episode["episodeName"],
            )
            continue

        logging.info(
            "Adding episode: %s - %s - %s",
            episode["episodeContinuous"],
            episode["seasonEpisode"],
            episode["episodeName"],
        )
        if episode_url:
            try:
                episode["episodeDescription"] = load_episode_description(episode_url)
            except Exception as error:
                logging.error("Failed to load description for %s: %s", episode["episodeName"], error)
        additions.append(episode)
        existing_keys.add(key)

    if additions:
        existing_episodes.extend(additions)
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as metadata_file:
            json.dump(existing_episodes, metadata_file, ensure_ascii=False, indent=2)
    elif not os.path.exists(filename):
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as metadata_file:
            json.dump(existing_episodes, metadata_file, ensure_ascii=False, indent=2)


def main():
    if len(sys.argv) != 2:
        print("Usage: python DownloadTelevisionSeries.py <json_filename>")
        return 1

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logging.info("Starting processing")
    try:
        series_config = read_configuration(sys.argv[1])
    except (OSError, json.JSONDecodeError) as error:
        logging.error("Could not read configuration: %s", error)
        return 1

    os.makedirs("Metadata", exist_ok=True)
    for series in series_config:
        series_url = series.get("serienUrl", "")
        series_file_name = series.get("serieFileName", "series")
        output_path = os.path.join("Metadata", metadata_filename(series_file_name))
        episode_guide_url = urljoin(BASE_URL, series_url.rstrip("/") + "/episodenguide")

        try:
            logging.info("---------------------------------------------------------------------------------------------")
            logging.info("Start processing for %s", series_file_name)
            episodes = extract_episodes(fetch_html(episode_guide_url), episode_guide_url)
            update_metadata_file(output_path, episodes)
            logging.info("Completed processing for %s", series_file_name)
        except Exception as error:
            logging.error("Failed to process %s from %s: %s", series_file_name, episode_guide_url, error)

    logging.info("Processing complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())