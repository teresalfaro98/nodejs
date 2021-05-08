"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = __importDefault(require("mongodb"));
exports.default = (ENV, mongo) => {
    const _getSecretKey = (apiKey) => __awaiter(void 0, void 0, void 0, function* () {
        // Utilizar la API KEY para consultar la tabla APP y obtener el SecretKey
        return yield mongo.db.collection('app')
            .findOne({ _id: new mongodb_1.default.ObjectID(apiKey) }, { projection: { _id: 0, secretKey: 1 } })
            .then((result) => {
            if (!result) {
                return null;
            }
            return result;
        })
            .catch((error) => {
            console.log(error);
            return null;
        });
    });
    return {
        create: (payload, apiKey) => __awaiter(void 0, void 0, void 0, function* () {
            // Utilizar la API KEY para consultar la tabla APP y obtener el SecretKey
            const response = yield _getSecretKey(apiKey);
            return new Promise((resolve, reject) => {
                jsonwebtoken_1.default.sign(payload, response.secretKey, { expiresIn: ENV.TOKEN.EXPIRES }, (error, token) => {
                    if (error) {
                        return reject({ ok: false, error });
                    }
                    return resolve({ ok: true, token });
                });
            });
        }),
        verify: (bearerToken, apiKey) => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield _getSecretKey(apiKey);
            return jsonwebtoken_1.default.verify(bearerToken, response.secretKey, (error, tokenDecoded) => {
                if (error) {
                    return { ok: false, error };
                }
                return { ok: true, tokenDecoded };
            });
        }),
        refresh: () => {
            // TO DO:
        }
    };
};
