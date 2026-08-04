import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const getImageUrl = (url) => {
  if (!url) return "";
  return url.split(",")[0].split("?")[0].trim();
};

const isVideoUrl = (url) => {
  if (!url) return false;
  const ext = url.split("?").shift().split(".").pop()?.toLowerCase();
  return ["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "3gp", "m4v", "ogv"].includes(ext);
};

const decodeHTML = (str) => {
  if (!str) return "";
  const text = document.createElement("textarea");
  text.innerHTML = str;
  return text.value;
};

const ProductCard = ({ product }) => {
  const { addToCart, removeFromCart, isInCart } = useCart();
  const navigate = useNavigate();

  const {
    name,
    retailPrice,
    description,
    stock,
    imageUrl,
    videoUrl,
    sku,
    weight,
    createdAt,
  } = product;

  const isNew = createdAt && Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  const mainImage = getImageUrl(imageUrl);
  const mainVideo = getImageUrl(videoUrl);

  const isAvailable = product.inStock !== undefined ? product.inStock : (stock ?? 0) > 0;
  const stockStatus = isAvailable
    ? { label: "In Stock", bg: "#dcfce7", color: "#16a34a" }
    : { label: "Out of Stock", bg: "#fee2e2", color: "#dc2626" };

  const formattedPrice = `PKR ${Number(retailPrice || 0).toLocaleString("en-PK")}`;
  const cleanDesc = decodeHTML(description || "");
  const productSlug = product.slug || product._id;

  return (
    <article
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={() => navigate(`/product/${productSlug}`)}
    >
      <figure
        style={{
          width: "100%",
          height: "185px",
          margin: 0,
          background: imageUrl || videoUrl
            ? "#f9fafb"
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {mainVideo ? (
          <video
            src={mainVideo}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            muted
            loop
            playsInline
            aria-label={name}
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.style.background =
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
            }}
          />
        ) : mainImage ? (
          isVideoUrl(mainImage) ? (
            <video
              src={mainImage}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
              loop
              playsInline
              aria-label={name}
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.style.background =
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
              }}
            />
          ) : (
            <img
              src={mainImage}
              alt={name || "Product image"}
              loading="lazy"
              decoding="async"
              width="300"
              height="185"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.style.background =
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
              }}
            />
          )
        ) : (
          <span style={{ fontSize: "52px", fontWeight: "700", color: "#fff" }}>
            {(name || "?").charAt(0).toUpperCase()}
          </span>
        )}

        {isNew && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "rgba(239,68,68,0.9)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            NEW
          </span>
        )}

        <span
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: stockStatus.bg,
            color: stockStatus.color,
            fontSize: "10px",
            fontWeight: "700",
            padding: "3px 10px",
            borderRadius: "20px",
          }}
        >
          {stockStatus.label}
        </span>
      </figure>

      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flex: 1,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "600",
            color: "#111827",
            lineHeight: "1.4",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/product/${productSlug}`)}
        >
          {name}
        </h3>

        {cleanDesc && (
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {cleanDesc.length > 120 ? cleanDesc.slice(0, 120) + "..." : cleanDesc}
          </p>
        )}

        <div style={{ display: "flex", gap: "12px", marginTop: "2px" }}>
          {sku && (
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
              SKU: {sku}
            </span>
          )}
          {weight > 0 && (
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
              {weight} kg
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "10px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <span
            style={{ fontSize: "17px", fontWeight: "700", color: "#111827" }}
          >
            {formattedPrice}
          </span>
        </div>

        {isInCart(product._id) ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              disabled={!isAvailable}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                background: !isAvailable ? "#e5e7eb" : "#6366f1",
                color: !isAvailable ? "#9ca3af" : "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: !isAvailable ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {!isAvailable ? "Out of Stock" : "✓ Add Again"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFromCart(product._id);
              }}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                background: "#fff",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ef4444";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#ef4444";
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={!isAvailable}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                background: !isAvailable ? "#e5e7eb" : "#6366f1",
                color: !isAvailable ? "#9ca3af" : "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: !isAvailable ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (isAvailable) e.currentTarget.style.background = "#4f46e5";
              }}
              onMouseLeave={(e) => {
                if (isAvailable) e.currentTarget.style.background = "#6366f1";
              }}
            >
              {!isAvailable ? "Out of Stock" : "🛒 Add to Cart"}
          </button>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
