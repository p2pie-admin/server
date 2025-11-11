"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickString = void 0;
const pickString = (value) => typeof value === "string" && value.trim().length ? value.trim() : undefined;
exports.pickString = pickString;
