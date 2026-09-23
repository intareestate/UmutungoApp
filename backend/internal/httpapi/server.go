package httpapi

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/umutungo/umutungo/backend/internal/config"
)

type Server struct {
	db  *pgxpool.Pool
	cfg config.Config
}

type CurrentUser struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email,omitempty"`
	Phone  string `json:"phone"`
	Role   string `json:"role"`
	Status string `json:"status"`
}

func New(db *pgxpool.Pool, cfg config.Config) *Server {
	return &Server{db: db, cfg: cfg}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.health)
	mux.HandleFunc("/readyz", s.ready)
	mux.HandleFunc("/api/v1/auth/register", s.register)
	mux.HandleFunc("/api/v1/auth/request-otp", s.requestOTP)
	mux.HandleFunc("/api/v1/auth/verify-otp", s.verifyOTP)
	mux.HandleFunc("/api/v1/me", s.me)
	mux.HandleFunc("/api/v1/listings", s.listings)
	mux.HandleFunc("/api/v1/listings/", s.listingRoute)
	mux.HandleFunc("/api/v1/applications", s.applications)
	mux.HandleFunc("/api/v1/applications/", s.applicationRoute)
	mux.HandleFunc("/api/v1/bookings", s.bookings)
	mux.HandleFunc("/api/v1/reports", s.reports)
	mux.HandleFunc("/api/v1/notifications", s.notifications)
	mux.HandleFunc("/api/v1/owner/dashboard", s.ownerDashboard)
	mux.HandleFunc("/api/v1/tenant/dashboard", s.tenantDashboard)
	mux.HandleFunc("/api/v1/maintenance", s.maintenance)
	return s.middleware(mux)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) ready(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.db.Ping(r.Context()); err != nil {
		errorJSON(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
		Role  string `json:"role"`
	}
	if !decodeJSON(w, r, &input) || strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Phone) == "" {
		errorJSON(w, http.StatusBadRequest, "name and phone are required")
		return
	}
	input.Role = strings.ToLower(strings.TrimSpace(input.Role))
	if input.Role == "" {
		input.Role = "client"
	}
	if !validRole(input.Role) || input.Role == "admin" {
		errorJSON(w, http.StatusBadRequest, "invalid registration role")
		return
	}

	var user CurrentUser
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO users(name, email, phone, role) VALUES($1, NULLIF($2, ''), $3, $4)
		RETURNING id, name, COALESCE(email, ''), phone, role, status`,
		strings.TrimSpace(input.Name), strings.TrimSpace(input.Email), strings.TrimSpace(input.Phone), input.Role).
		Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.Role, &user.Status)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			errorJSON(w, http.StatusConflict, "a user with this phone already exists")
			return
		}
		errorJSON(w, http.StatusInternalServerError, "could not create user")
		return
	}
	_, _ = s.db.Exec(r.Context(), `INSERT INTO profiles(user_id) VALUES($1)`, user.ID)
	if input.Role == "komisiyoneri" || input.Role == "property_owner" {
		_, _ = s.db.Exec(r.Context(), `INSERT INTO business_profiles(user_id) VALUES($1)`, user.ID)
	}
	code := "111111"
	if s.cfg.AppEnv != "development" {
		code = randomDigits(6)
	}
	if _, err := s.db.Exec(r.Context(), `INSERT INTO otp_challenges(phone, code_hash, expires_at) VALUES($1, $2, NOW() + INTERVAL '10 minutes')`, input.Phone, hash(code)); err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not create OTP challenge")
		return
	}
	response := map[string]any{"user": user, "message": "registration created; verify phone with OTP"}
	if s.cfg.AppEnv == "development" {
		response["development_code"] = code
	}
	writeJSON(w, http.StatusCreated, response)
}

func (s *Server) requestOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var input struct {
		Phone string `json:"phone"`
	}
	if !decodeJSON(w, r, &input) || strings.TrimSpace(input.Phone) == "" {
		errorJSON(w, http.StatusBadRequest, "phone is required")
		return
	}
	var code string
	if s.cfg.AppEnv == "development" {
		code = "111111"
	} else {
		code = randomDigits(6)
	}
	_, err := s.db.Exec(r.Context(), `INSERT INTO otp_challenges(phone, code_hash, expires_at) VALUES($1, $2, NOW() + INTERVAL '10 minutes')`, input.Phone, hash(code))
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not create OTP challenge")
		return
	}
	response := map[string]any{"message": "OTP sent"}
	if s.cfg.AppEnv == "development" {
		response["development_code"] = code
	}
	writeJSON(w, http.StatusOK, response)
}

func (s *Server) verifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var input struct {
		Phone string `json:"phone"`
		Code  string `json:"code"`
	}
	if !decodeJSON(w, r, &input) || input.Phone == "" || input.Code == "" {
		errorJSON(w, http.StatusBadRequest, "phone and code are required")
		return
	}
	var challengeID string
	var codeHash string
	var userID string
	err := s.db.QueryRow(r.Context(), `
		SELECT c.id, c.code_hash, u.id
		FROM otp_challenges c JOIN users u ON u.phone = c.phone
		WHERE c.phone=$1 AND c.used_at IS NULL AND c.expires_at > NOW()
		ORDER BY c.created_at DESC LIMIT 1`, input.Phone).Scan(&challengeID, &codeHash, &userID)
	if err != nil || hash(input.Code) != codeHash {
		errorJSON(w, http.StatusUnauthorized, "invalid or expired OTP")
		return
	}
	if _, err := s.db.Exec(r.Context(), `UPDATE otp_challenges SET used_at=NOW() WHERE id=$1`, challengeID); err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not verify OTP")
		return
	}
	token, err := s.createSession(r, userID)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not create session")
		return
	}
	user, _ := s.userByID(r, userID)
	writeJSON(w, http.StatusOK, map[string]any{"user": user, "access_token": token})
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

type listingInput struct {
	Category        string     `json:"category"`
	TransactionType string     `json:"transaction_type"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Price           float64    `json:"price"`
	Currency        string     `json:"currency"`
	Province        string     `json:"province"`
	District        string     `json:"district"`
	Sector          string     `json:"sector"`
	Cell            string     `json:"cell"`
	Village         string     `json:"village"`
	Latitude        *float64   `json:"latitude"`
	Longitude       *float64   `json:"longitude"`
	PublishAt       *time.Time `json:"publish_at"`
	Tags            []string   `json:"tags"`
	Amenities       []string   `json:"amenities"`
	ContactMethod   string     `json:"contact_method"`
	Media           []struct {
		Type string `json:"type"`
		URL  string `json:"url"`
	} `json:"media"`
	Measurements map[string]any `json:"measurements"`
}

func (s *Server) listings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.listListing(w, r)
	case http.MethodPost:
		s.createListing(w, r)
	default:
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) listListing(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	args := []any{search, q.Get("province"), q.Get("district"), q.Get("sector"), q.Get("category"), q.Get("transaction_type")}
	rows, err := s.db.Query(r.Context(), `
		SELECT l.id, l.owner_id, u.name, u.role, l.category, l.transaction_type,
		l.title, l.description, l.price, l.currency, l.province, l.district, l.sector,
		COALESCE(l.cell,''), COALESCE(l.village,''), l.latitude, l.longitude, l.status,
		l.tags, l.amenities, l.created_at
		FROM listings l JOIN users u ON u.id=l.owner_id
		WHERE l.deleted_at IS NULL AND l.status='published'
		AND ($1='' OR l.title ILIKE '%' || $1 || '%' OR l.description ILIKE '%' || $1 || '%')
		AND ($2='' OR l.province=$2) AND ($3='' OR l.district=$3)
		AND ($4='' OR l.sector=$4) AND ($5='' OR l.category=$5)
		AND ($6='' OR l.transaction_type=$6)
		ORDER BY l.created_at DESC LIMIT 100`, args...)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not load listings")
		return
	}
	defer rows.Close()
	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, ownerID, ownerName, ownerRole, category, transactionType, title, description string
		var price float64
		var currency, province, district, sector, cell, village, status string
		var latitude, longitude *float64
		var tags, amenities []byte
		var createdAt time.Time
		if err := rows.Scan(&id, &ownerID, &ownerName, &ownerRole, &category, &transactionType, &title, &description, &price, &currency, &province, &district, &sector, &cell, &village, &latitude, &longitude, &status, &tags, &amenities, &createdAt); err != nil {
			errorJSON(w, http.StatusInternalServerError, "could not read listings")
			return
		}
		items = append(items, map[string]any{
			"id": id, "owner": map[string]string{"id": ownerID, "name": ownerName, "role": ownerRole},
			"category": category, "transaction_type": transactionType, "title": title, "description": description,
			"price": price, "currency": currency, "province": province, "district": district, "sector": sector,
			"cell": cell, "village": village, "latitude": latitude, "longitude": longitude, "status": status,
			"tags": rawJSON(tags), "amenities": rawJSON(amenities), "created_at": createdAt,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "count": len(items)})
}

func (s *Server) createListing(w http.ResponseWriter, r *http.Request) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	if user.Role != "komisiyoneri" && user.Role != "property_owner" && user.Role != "admin" {
		errorJSON(w, http.StatusForbidden, "only brokers, property owners, or admins can create listings")
		return
	}
	var input listingInput
	if !decodeJSON(w, r, &input) {
		return
	}
	input.TransactionType = strings.ToLower(strings.TrimSpace(input.TransactionType))
	if input.Category == "" || input.Title == "" || input.Province == "" || input.District == "" || input.Sector == "" || !validTransaction(input.TransactionType) {
		errorJSON(w, http.StatusBadRequest, "category, title, transaction_type, province, district, and sector are required")
		return
	}
	limit := 100
	if user.Role == "komisiyoneri" {
		limit = 10
	}
	var monthlyCount int
	if err := s.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM listings WHERE owner_id=$1 AND created_at >= date_trunc('month', NOW()) AND status <> 'cancelled'`, user.ID).Scan(&monthlyCount); err == nil && monthlyCount >= limit {
		errorJSON(w, http.StatusConflict, "monthly listing quota reached")
		return
	}
	status := "published"
	if input.PublishAt != nil && input.PublishAt.After(time.Now()) {
		status = "scheduled"
	}
	expires := time.Now().Add(90 * 24 * time.Hour)
	if user.Role == "komisiyoneri" {
		expires = time.Now().Add(30 * 24 * time.Hour)
	}
	tags, _ := json.Marshal(input.Tags)
	amenities, _ := json.Marshal(input.Amenities)
	var id string
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO listings(owner_id, category, transaction_type, title, description, price, currency,
		province, district, sector, cell, village, latitude, longitude, status, publish_at, expires_at,
		tags, amenities, contact_method)
		VALUES($1,$2,$3,$4,$5,$6,COALESCE(NULLIF($7,''),'RWF'),$8,$9,$10,NULLIF($11,''),NULLIF($12,''),$13,$14,$15,$16,$17,$18,$19,COALESCE(NULLIF($20,''),'message')) RETURNING id`,
		user.ID, input.Category, input.TransactionType, input.Title, input.Description, input.Price, input.Currency,
		input.Province, input.District, input.Sector, input.Cell, input.Village, input.Latitude, input.Longitude,
		status, input.PublishAt, expires, tags, amenities, input.ContactMethod).Scan(&id)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not create listing")
		return
	}
	for index, media := range input.Media {
		mediaType := media.Type
		if mediaType == "" {
			mediaType = "photo"
		}
		_, _ = s.db.Exec(r.Context(), `INSERT INTO listing_media(listing_id, media_type, url, sort_order) VALUES($1,$2,$3,$4)`, id, mediaType, media.URL, index)
	}
	if input.Measurements != nil {
		measurementJSON, _ := json.Marshal(input.Measurements)
		_, _ = s.db.Exec(r.Context(), `INSERT INTO measurements(listing_id, room_dimensions) VALUES($1,$2)`, id, measurementJSON)
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "status": status, "expires_at": expires})
}

func (s *Server) listingRoute(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/listings/"), "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		errorJSON(w, http.StatusNotFound, "listing not found")
		return
	}
	id := parts[0]
	if len(parts) > 1 && parts[1] == "applications" && r.Method == http.MethodPost {
		s.createApplication(w, r, id)
		return
	}
	switch r.Method {
	case http.MethodGet:
		s.getListing(w, r, id)
	case http.MethodPatch:
		s.updateListing(w, r, id)
	case http.MethodDelete:
		s.deleteListing(w, r, id)
	default:
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) getListing(w http.ResponseWriter, r *http.Request, id string) {
	var item map[string]any
	var ownerID, ownerName, ownerRole, category, transactionType, title, description, currency, province, district, sector, cell, village, status string
	var price float64
	var latitude, longitude *float64
	var tags, amenities []byte
	var createdAt, expiresAt time.Time
	err := s.db.QueryRow(r.Context(), `SELECT l.owner_id,u.name,u.role,l.category,l.transaction_type,l.title,l.description,l.price,l.currency,l.province,l.district,l.sector,COALESCE(l.cell,''),COALESCE(l.village,''),l.latitude,l.longitude,l.status,l.tags,l.amenities,l.created_at,l.expires_at FROM listings l JOIN users u ON u.id=l.owner_id WHERE l.id=$1 AND l.deleted_at IS NULL`, id).
		Scan(&ownerID, &ownerName, &ownerRole, &category, &transactionType, &title, &description, &price, &currency, &province, &district, &sector, &cell, &village, &latitude, &longitude, &status, &tags, &amenities, &createdAt, &expiresAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			errorJSON(w, http.StatusNotFound, "listing not found")
			return
		}
		errorJSON(w, http.StatusInternalServerError, "could not load listing")
		return
	}
	item = map[string]any{"id": id, "owner": map[string]string{"id": ownerID, "name": ownerName, "role": ownerRole}, "category": category, "transaction_type": transactionType, "title": title, "description": description, "price": price, "currency": currency, "province": province, "district": district, "sector": sector, "cell": cell, "village": village, "latitude": latitude, "longitude": longitude, "status": status, "tags": rawJSON(tags), "amenities": rawJSON(amenities), "created_at": createdAt, "expires_at": expiresAt}
	rows, _ := s.db.Query(r.Context(), `SELECT media_type,url,sort_order FROM listing_media WHERE listing_id=$1 ORDER BY sort_order`, id)
	media := make([]map[string]any, 0)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var mediaType, url string
			var order int
			if rows.Scan(&mediaType, &url, &order) == nil {
				media = append(media, map[string]any{"type": mediaType, "url": url, "sort_order": order})
			}
		}
	}
	item["media"] = media
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) updateListing(w http.ResponseWriter, r *http.Request, id string) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var ownerID string
	if err := s.db.QueryRow(r.Context(), `SELECT owner_id FROM listings WHERE id=$1 AND deleted_at IS NULL`, id).Scan(&ownerID); err != nil {
		errorJSON(w, http.StatusNotFound, "listing not found")
		return
	}
	if user.ID != ownerID && user.Role != "admin" {
		errorJSON(w, http.StatusForbidden, "you cannot edit this listing")
		return
	}
	var input struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		Status      string  `json:"status"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.Status != "" && !validListingStatus(input.Status) {
		errorJSON(w, http.StatusBadRequest, "invalid listing status")
		return
	}
	_, err := s.db.Exec(r.Context(), `UPDATE listings SET title=COALESCE(NULLIF($1,''),title), description=COALESCE(NULLIF($2,''),description), price=CASE WHEN $3 >= 0 THEN $3 ELSE price END, status=COALESCE(NULLIF($4,''),status), updated_at=NOW() WHERE id=$5`, input.Title, input.Description, input.Price, input.Status, id)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not update listing")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "updated", "id": id})
}

func (s *Server) deleteListing(w http.ResponseWriter, r *http.Request, id string) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	result, err := s.db.Exec(r.Context(), `UPDATE listings SET status='cancelled', deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND (owner_id=$2 OR $3='admin') AND deleted_at IS NULL`, id, user.ID, user.Role)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not delete listing")
		return
	}
	if result.RowsAffected() == 0 {
		errorJSON(w, http.StatusNotFound, "listing not found or not owned by you")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
}

func (s *Server) createApplication(w http.ResponseWriter, r *http.Request, listingID string) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var input struct {
		Message       string         `json:"message"`
		ApplicantInfo map[string]any `json:"applicant_info"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	info, _ := json.Marshal(input.ApplicantInfo)
	var appID, ownerID string
	err := s.db.QueryRow(r.Context(), `INSERT INTO rental_applications(listing_id, applicant_id, message, applicant_info) SELECT $1,$2,$3,$4 WHERE EXISTS(SELECT 1 FROM listings WHERE id=$1 AND status='published') RETURNING id, (SELECT owner_id FROM listings WHERE id=$1)`, listingID, user.ID, input.Message, info).Scan(&appID, &ownerID)
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "listing is not available for applications")
		return
	}
	_, _ = s.db.Exec(r.Context(), `INSERT INTO notifications(user_id,type,title,body) VALUES($1,'application_received','New rental application',$2)`, ownerID, fmt.Sprintf("%s applied to one of your properties", user.Name))
	writeJSON(w, http.StatusCreated, map[string]string{"id": appID, "status": "pending"})
}

func (s *Server) applications(w http.ResponseWriter, r *http.Request) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	if r.Method != http.MethodGet {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	rows, err := s.db.Query(r.Context(), `SELECT a.id,a.listing_id,l.title,a.applicant_id,u.name,a.status,a.message,a.created_at FROM rental_applications a JOIN listings l ON l.id=a.listing_id JOIN users u ON u.id=a.applicant_id WHERE a.applicant_id=$1 OR l.owner_id=$1 ORDER BY a.created_at DESC`, user.ID)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not load applications")
		return
	}
	defer rows.Close()
	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, listingID, title, applicantID, applicantName, status, message string
		var createdAt time.Time
		if rows.Scan(&id, &listingID, &title, &applicantID, &applicantName, &status, &message, &createdAt) == nil {
			items = append(items, map[string]any{"id": id, "listing_id": listingID, "listing_title": title, "applicant_id": applicantID, "applicant_name": applicantName, "status": status, "message": message, "created_at": createdAt})
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) applicationRoute(w http.ResponseWriter, r *http.Request) {
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/applications/"), "/")
	if r.Method != http.MethodPost || id == "" {
		errorJSON(w, http.StatusMethodNotAllowed, "use POST /api/v1/applications/{id}/decision")
		return
	}
	if !strings.HasSuffix(id, "/decision") {
		errorJSON(w, http.StatusNotFound, "application route not found")
		return
	}
	s.decideApplication(w, r, strings.TrimSuffix(id, "/decision"))
}

func (s *Server) decideApplication(w http.ResponseWriter, r *http.Request, id string) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var input struct {
		Status string `json:"status"`
		Note   string `json:"note"`
	}
	if !decodeJSON(w, r, &input) || !validApplicationStatus(input.Status) {
		errorJSON(w, http.StatusBadRequest, "status must be accepted, rejected, or more_info")
		return
	}
	var applicantID, listingID, ownerID string
	err := s.db.QueryRow(r.Context(), `SELECT a.applicant_id,a.listing_id,l.owner_id FROM rental_applications a JOIN listings l ON l.id=a.listing_id WHERE a.id=$1`, id).Scan(&applicantID, &listingID, &ownerID)
	if err != nil || (user.ID != ownerID && user.Role != "admin") {
		errorJSON(w, http.StatusForbidden, "you cannot decide this application")
		return
	}
	tx, err := s.db.Begin(r.Context())
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not start application update")
		return
	}
	defer tx.Rollback(r.Context())
	if _, err = tx.Exec(r.Context(), `UPDATE rental_applications SET status=$1, decision_note=$2, decided_at=NOW() WHERE id=$3`, input.Status, input.Note, id); err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not update application")
		return
	}
	if input.Status == "accepted" {
		if _, err = tx.Exec(r.Context(), `INSERT INTO rental_agreements(listing_id,tenant_id,landlord_id,rent_amount,currency) SELECT $1,$2,l.owner_id,l.price,l.currency FROM listings l WHERE l.id=$1`, listingID, applicantID); err != nil {
			errorJSON(w, http.StatusInternalServerError, "could not create tenant relationship")
			return
		}
		_, _ = tx.Exec(r.Context(), `UPDATE users SET role='tenant', updated_at=NOW() WHERE id=$1 AND role='client'`, applicantID)
	}
	_, _ = tx.Exec(r.Context(), `INSERT INTO notifications(user_id,type,title,body) VALUES($1,'application_decision','Rental application update',$2)`, applicantID, "Your rental application was "+input.Status)
	if err := tx.Commit(r.Context()); err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not finish application update")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"id": id, "status": input.Status})
}

func (s *Server) bookings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var input struct {
		ListingID string `json:"listing_id"`
		CheckIn   string `json:"check_in"`
		CheckOut  string `json:"check_out"`
		Guests    int    `json:"guests"`
	}
	if !decodeJSON(w, r, &input) || input.ListingID == "" || input.CheckIn == "" || input.CheckOut == "" {
		errorJSON(w, http.StatusBadRequest, "listing_id, check_in, and check_out are required")
		return
	}
	if input.Guests < 1 {
		input.Guests = 1
	}
	var id string
	err := s.db.QueryRow(r.Context(), `INSERT INTO bookings(listing_id,guest_id,check_in,check_out,guests) VALUES($1,$2,$3,$4,$5) RETURNING id`, input.ListingID, user.ID, input.CheckIn, input.CheckOut, input.Guests).Scan(&id)
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "could not create booking")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": id, "status": "requested"})
}

func (s *Server) reports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var input struct {
		ListingID      string `json:"listing_id"`
		ReportedUserID string `json:"reported_user_id"`
		Reason         string `json:"reason"`
		Details        string `json:"details"`
	}
	if !decodeJSON(w, r, &input) || !validReportReason(input.Reason) {
		errorJSON(w, http.StatusBadRequest, "a valid report reason is required")
		return
	}
	var id string
	err := s.db.QueryRow(r.Context(), `INSERT INTO reports(reporter_id,listing_id,reported_user_id,reason,details) VALUES($1,NULLIF($2,'')::uuid,NULLIF($3,'')::uuid,$4,$5) RETURNING id`, user.ID, input.ListingID, input.ReportedUserID, input.Reason, input.Details).Scan(&id)
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "could not submit report")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": id, "status": "pending"})
}

func (s *Server) notifications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	rows, err := s.db.Query(r.Context(), `SELECT id,type,title,body,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, user.ID)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not load notifications")
		return
	}
	defer rows.Close()
	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, typ, title, body string
		var readAt *time.Time
		var createdAt time.Time
		if rows.Scan(&id, &typ, &title, &body, &readAt, &createdAt) == nil {
			items = append(items, map[string]any{"id": id, "type": typ, "title": title, "body": body, "read_at": readAt, "created_at": createdAt})
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) ownerDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	if user.Role != "property_owner" && user.Role != "komisiyoneri" && user.Role != "admin" {
		errorJSON(w, http.StatusForbidden, "owner dashboard access required")
		return
	}
	var listingsCount, activeListings, applicationsCount, tenantsCount int
	_ = s.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM listings WHERE owner_id=$1 AND deleted_at IS NULL`, user.ID).Scan(&listingsCount)
	_ = s.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM listings WHERE owner_id=$1 AND status='published'`, user.ID).Scan(&activeListings)
	_ = s.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rental_applications a JOIN listings l ON l.id=a.listing_id WHERE l.owner_id=$1 AND a.status='pending'`, user.ID).Scan(&applicationsCount)
	_ = s.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rental_agreements WHERE landlord_id=$1 AND status='active'`, user.ID).Scan(&tenantsCount)
	writeJSON(w, http.StatusOK, map[string]any{"listings": listingsCount, "active_listings": activeListings, "pending_applications": applicationsCount, "active_tenants": tenantsCount})
}

func (s *Server) tenantDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	rows, err := s.db.Query(r.Context(), `SELECT ra.id,ra.listing_id,l.title,ra.rent_amount,ra.currency,ra.due_day,ra.start_date,ra.end_date,ra.status FROM rental_agreements ra LEFT JOIN listings l ON l.id=ra.listing_id WHERE ra.tenant_id=$1 ORDER BY ra.created_at DESC`, user.ID)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "could not load tenant account")
		return
	}
	defer rows.Close()
	properties := make([]map[string]any, 0)
	for rows.Next() {
		var id, listingID, title, currency, status string
		var rent float64
		var dueDay int
		var startDate, endDate *time.Time
		if rows.Scan(&id, &listingID, &title, &rent, &currency, &dueDay, &startDate, &endDate, &status) == nil {
			properties = append(properties, map[string]any{"agreement_id": id, "listing_id": listingID, "title": title, "rent_amount": rent, "currency": currency, "due_day": dueDay, "start_date": startDate, "end_date": endDate, "status": status})
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"properties": properties})
}

func (s *Server) maintenance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	user, ok := s.authUser(r)
	if !ok {
		errorJSON(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var input struct {
		LandlordID     string `json:"landlord_id"`
		PropertyUnitID string `json:"property_unit_id"`
		Title          string `json:"title"`
		Description    string `json:"description"`
	}
	if !decodeJSON(w, r, &input) || input.LandlordID == "" || input.Title == "" || input.Description == "" {
		errorJSON(w, http.StatusBadRequest, "landlord_id, title, and description are required")
		return
	}
	var id string
	err := s.db.QueryRow(r.Context(), `INSERT INTO maintenance_requests(tenant_id,landlord_id,property_unit_id,title,description) VALUES($1,$2,NULLIF($3,'')::uuid,$4,$5) RETURNING id`, user.ID, input.LandlordID, input.PropertyUnitID, input.Title, input.Description).Scan(&id)
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "could not create maintenance request")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": id, "status": "open"})
}

func (s *Server) authUser(r *http.Request) (CurrentUser, bool) {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
		return CurrentUser{}, false
	}
	token := strings.TrimSpace(header[len("Bearer "):])
	if token == "" {
		return CurrentUser{}, false
	}
	var user CurrentUser
	err := s.db.QueryRow(r.Context(), `SELECT u.id,u.name,COALESCE(u.email,''),u.phone,u.role,u.status FROM sessions se JOIN users u ON u.id=se.user_id WHERE se.token_hash=$1 AND se.expires_at > NOW() AND u.status='active'`, hash(token)).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.Role, &user.Status)
	return user, err == nil
}

func (s *Server) userByID(r *http.Request, id string) (CurrentUser, bool) {
	var user CurrentUser
	err := s.db.QueryRow(r.Context(), `SELECT id,name,COALESCE(email,''),phone,role,status FROM users WHERE id=$1`, id).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.Role, &user.Status)
	return user, err == nil
}

func (s *Server) createSession(r *http.Request, userID string) (string, error) {
	token, err := randomToken()
	if err != nil {
		return "", err
	}
	_, err = s.db.Exec(r.Context(), `INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')`, userID, hash(token))
	return token, err
}

func (s *Server) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		origin := r.Header.Get("Origin")
		if s.cfg.CorsOrigins == "*" || strings.Contains(","+s.cfg.CorsOrigins+",", ","+origin+",") {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Content-Type", "application/json")
		defer func() {
			if recovered := recover(); recovered != nil {
				errorJSON(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(target); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func errorJSON(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func validRole(role string) bool {
	switch role {
	case "client", "tenant", "komisiyoneri", "property_owner", "admin":
		return true
	default:
		return false
	}
}

func validTransaction(value string) bool {
	switch value {
	case "buy", "sell", "rent", "rent_out", "book":
		return true
	default:
		return false
	}
}

func validListingStatus(value string) bool {
	switch value {
	case "draft", "scheduled", "published", "expired", "cancelled":
		return true
	default:
		return false
	}
}

func validApplicationStatus(value string) bool {
	return value == "accepted" || value == "rejected" || value == "more_info"
}

func validReportReason(value string) bool {
	switch value {
	case "fraud", "duplicate", "incorrect_information", "sold_unavailable", "offensive_content", "other":
		return true
	default:
		return false
	}
}

func randomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func randomDigits(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "111111"
	}
	for i := range b {
		b[i] = '0' + (b[i] % 10)
	}
	return string(b)
}

func hash(value string) string {
	digest := sha256.Sum256([]byte(value))
	return hex.EncodeToString(digest[:])
}

func rawJSON(value []byte) any {
	if len(value) == 0 {
		return []any{}
	}
	var decoded any
	if json.Unmarshal(value, &decoded) != nil {
		return []any{}
	}
	return decoded
}
