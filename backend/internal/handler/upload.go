package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadHandler handles binary asset uploads (e.g. images).
type UploadHandler struct {
	dir       string
	publicURL string
}

// NewUploadHandler creates a handler that stores files under dir
// and exposes them under publicURL (e.g. "/uploads").
// Allowed image MIME prefixes are restricted to image/*.
func NewUploadHandler(dir, publicURL string) (*UploadHandler, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &UploadHandler{dir: dir, publicURL: strings.TrimRight(publicURL, "/")}, nil
}

const maxUploadBytes = 10 * 1024 * 1024 // 10 MiB

// UploadImage saves an uploaded image and returns its public URL.
// Form field name: "file".
func (h *UploadHandler) UploadImage(c *gin.Context) {
	// Cap request body to bound memory/disk usage even before MultipartForm parses it.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadBytes)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing form field 'file'"})
		return
	}
	if fileHeader.Size > maxUploadBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large (max 10MB)"})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot open uploaded file"})
		return
	}
	defer src.Close()

	// Sniff MIME from the first 512 bytes; do not trust client-supplied Content-Type.
	head := make([]byte, 512)
	n, _ := io.ReadFull(src, head)
	head = head[:n]
	mime := http.DetectContentType(head)
	if !strings.HasPrefix(mime, "image/") {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "only image uploads are allowed"})
		return
	}
	ext := extensionForMIME(mime)
	if ext == "" {
		// Fall back to original extension if it looks safe.
		origExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
		if isSafeImageExt(origExt) {
			ext = origExt
		} else {
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "unsupported image type"})
			return
		}
	}

	// Random filename to avoid collisions and path-traversal via original name.
	randPart, err := randomHex(8)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate filename"})
		return
	}
	name := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), randPart, ext)
	dst := filepath.Join(h.dir, name)

	out, err := os.Create(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create file"})
		return
	}
	defer out.Close()

	// Write back the sniffed prefix, then stream the rest.
	if _, err := out.Write(head); err != nil {
		os.Remove(dst)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write file"})
		return
	}
	if _, err := io.Copy(out, src); err != nil {
		os.Remove(dst)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write file"})
		return
	}

	url := h.publicURL + "/" + name
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"url":      url,
			"filename": name,
			"size":     fileHeader.Size,
			"mime":     mime,
		},
	})
}

func extensionForMIME(mime string) string {
	switch mime {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "image/bmp":
		return ".bmp"
	case "image/svg+xml":
		return ".svg"
	}
	return ""
}

func isSafeImageExt(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg":
		return true
	}
	return false
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
