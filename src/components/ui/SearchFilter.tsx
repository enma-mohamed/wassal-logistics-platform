"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export default function SearchFilter({ placeholder = "بحث...", onSearch }: SearchFilterProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="inline-search-bar" style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      maxWidth: "340px",
      width: "100%",
    }}>
      <Search size={16} style={{
        position: "absolute",
        right: "0.85rem",
        color: "var(--text-muted)",
        pointerEvents: "none",
      }} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
        style={{
          paddingRight: "2.5rem",
          paddingLeft: query ? "2.5rem" : "1rem",
          fontSize: "0.9rem",
          height: "42px",
        }}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: "absolute",
            left: "0.75rem",
            background: "none",
            border: "none",
            padding: "0.25rem",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
