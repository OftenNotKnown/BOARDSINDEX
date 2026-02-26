import os
import sys

DATA_DIR = "../DATA"

def list_files():
    files = sorted(os.listdir(DATA_DIR))
    for i, f in enumerate(files):
        print(f"{i}: {f}")

def open_file(index):
    files = sorted(os.listdir(DATA_DIR))
    try:
        path = os.path.join(DATA_DIR, files[index])
        with open(path, "r") as f:
            print("\n--- FILE CONTENT ---")
            print(f.read())
            print("--- END ---\n")
    except:
        print("Invalid file index.")

def add_entry(filename, text):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "a") as f:
        f.write("\n" + text)
    print("Entry added.")

def search_by_date(date):
    for f in os.listdir(DATA_DIR):
        if date in f:
            print(f)

def help():
    print("""
Commands:
  list                     List all files
  open <index>              Open a file
  add <filename> <text>     Append text to a file
  search <YYYY-MM-DD>       Search by date
  exit                      Quit
""")

def main():
    help()
    while True:
        cmd = input("> ").split()
        if not cmd:
            continue
        if cmd[0] == "list":
            list_files()
        elif cmd[0] == "open":
            open_file(int(cmd[1]))
        elif cmd[0] == "add":
            add_entry(cmd[1], " ".join(cmd[2:]))
        elif cmd[0] == "search":
            search_by_date(cmd[1])
        elif cmd[0] == "exit":
            break
        else:
            help()

if __name__ == "__main__":
    main()
