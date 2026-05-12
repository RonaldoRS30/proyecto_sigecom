// src/components/erp/useAutocompleteERP.js

import { useState, useEffect, useRef } from "react";
import api from "@/services/api";

/* ============================================
   🧠 useAutocompleteERP — Motor único ERP
============================================ */

const normalizeText = (text = "") =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function useAutocompleteERP({
  endpoint,
  queryParam = "q",
  idField = "id",
  labelField = "nombre",
  limit = 20,
  extraParams = {},
}) {
  const containerRef = useRef(null);

  const cacheRef = useRef({});
  const abortRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selected, setSelected] = useState(false);

  /* ===========================
     Reset ERP
  =========================== */

  const reset = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
    setSelected(false);
  };

  /* ===========================
     Highlight
  =========================== */

  const highlightMatch = (text) => {
    const cleanQuery = normalizeText(query);
    if (!cleanQuery) return text;

    return text.split(/(\s+)/).map((part, i) =>
      normalizeText(part).includes(cleanQuery) ? (
        <span
          key={i}
          className="bg-yellow-200/70 rounded px-0.5"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  /* ===========================
     Fetch ERP
  =========================== */

  const fetchData = async (q = "") => {
    // Soft-limit cache
    if (Object.keys(cacheRef.current).length > 50) {
      cacheRef.current = {};
    }

    if (cacheRef.current[q]) {
      setResults(cacheRef.current[q]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();

    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const { data } = await api.get(endpoint, {
        params: {
          [queryParam]: q,
          ...extraParams,
        },
        signal: abortRef.current.signal,
      });

      const clean = Array.isArray(data)
        ? data.slice(0, limit)
        : [];

      cacheRef.current[q] = clean;
      setResults(clean);

    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error("❌ Autocomplete ERP:", err);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     Debounce
  =========================== */

  useEffect(() => {
    if (!query.trim() || selected) return;

    const timeout = setTimeout(() => {
      fetchData(normalizeText(query));
      setShowDropdown(true);
    }, 300);

    return () => clearTimeout(timeout);

  }, [query, selected]);

  /* ===========================
     Click outside
  =========================== */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  /* ===========================
     Cleanup AbortController
  =========================== */

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [results]);

  return {
    containerRef,

    query,
    setQuery,

    results,
    loading,

    showDropdown,
    setShowDropdown,

    highlightIndex,
    setHighlightIndex,

    selected,
    setSelected,

    reset,

    highlightMatch,

    idField,
    labelField,
  };
}
