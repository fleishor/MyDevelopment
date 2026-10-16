import logging
import sys
from pathlib import Path

def has_matching_mp4(json_path):
    return any(
        candidate.is_file()
        and candidate.stem == json_path.stem
        and candidate.suffix.lower() == ".mp4"
        for candidate in json_path.parent.iterdir()
    )

def main():
    directory = Path.cwd()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logging.info("Starting processing in %s", directory)

    try:
        for json_path in sorted(directory.rglob("*")):
            if not json_path.is_file() or json_path.suffix.lower() != ".json":
                continue

            try:
                if not has_matching_mp4(json_path):
                    print(json_path)
            except OSError as error:
                logging.error("Could not check %s: %s", json_path, error)
    except OSError as error:
        logging.error("Could not scan %s: %s", directory, error)
        return 1

    logging.info("Processing complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())