package main

import (
	_ "embed"
	"encoding/json"
	"errors"
	"log"
	"math"
	"net/http"
	"os"
	"sort"
)

type Highscore struct {
	Name  string `json:"name"`
	Email string `json:"-"`
	Score int    `json:"score"`
}

type Input struct {
	Name  string
	Email string
	Score int
}

func main() {
	dbFile := os.Getenv("DB_FILE")
	if dbFile == "" {
		dbFile = "database.json"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if _, err := os.Stat(dbFile); err == nil {
		log.Println("found db file")
	} else if errors.Is(err, os.ErrNotExist) {
		os.WriteFile(dbFile, []byte("[]"), 0666)
	} else {
		log.Fatal("File may or may not exist. I'm confused")
	}
	data, err := os.ReadFile(dbFile)
	if err != nil {
		log.Fatal("failed to read database")
	}
	var scoreboard []Highscore
	err = json.Unmarshal(data, &scoreboard)
	if err != nil {
		log.Fatal("failed to parse database")
	}

	http.HandleFunc("/scoreboard", CORS(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(scoreboard[0:int(math.Min(10, float64(len(scoreboard))))])
	}))

	http.HandleFunc("/submit", CORS(func(w http.ResponseWriter, r *http.Request) {
		var body Input
		err := json.NewDecoder(r.Body).Decode(&body)
		if err != nil {
			log.Printf("failed to parse body %v", err)
			w.WriteHeader(400)
			return
		}
		log.Printf("Found body %v", body)
		scoreboard = append(scoreboard, Highscore(body))
		sort.Slice(scoreboard, func(i, j int) bool {
			return scoreboard[i].Score > scoreboard[j].Score
		})
		json.NewEncoder(w).Encode(scoreboard[0:int(math.Min(10, float64(len(scoreboard))))])
		data, err := json.Marshal(scoreboard)
		if err != nil {
			log.Printf("failed to save database %v", err)
			return
		}
		err = os.WriteFile(dbFile, data, os.ModeType)
		if err != nil {
			log.Printf("failed to save database %v", err)
			return
		}
	}))
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	})
	http.HandleFunc("/yufskgdfsa", func(w http.ResponseWriter, r *http.Request) {
		scoreboard = []Highscore{}
		data, err := json.Marshal(scoreboard)
		if err != nil {
			log.Printf("failed to save database %v", err)
			return
		}
		err = os.WriteFile(dbFile, data, os.ModeType)
		if err != nil {
			log.Printf("failed to save database %v", err)
			return
		}
		w.WriteHeader(200)
	})
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("not existing path %v", r.URL.Path)
		http.Error(w, "No content", 404)
	})

	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Header().Add("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		w.Header().Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

		if r.Method == "OPTIONS" {
			http.Error(w, "No Content", http.StatusNoContent)
			return
		}

		next(w, r)
	}
}
