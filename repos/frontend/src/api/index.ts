import axios from "axios";
import { FsAPI } from "./fs";
import { ConfigAPI } from "./config";
import { LanguageAPI } from "./language";
import { ProjectAPI } from "./project";

export const apiAdapter = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

export const API = {
  fs: FsAPI,
  config: ConfigAPI,
  language: LanguageAPI,
  project: ProjectAPI,
};
