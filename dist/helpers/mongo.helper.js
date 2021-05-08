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
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class MongoDBHelper {
    constructor(ENV, isAuth = false) {
        this.statusConnection = {};
        this.dbUri = '';
        //this.dbUri = `mongodb://${ENV.HOST}:${ENV.PORT}/${ENV.DATABASE}`;
        this.dbUri = `mongodb://${ENV.USER_NAME}:${ENV.USER_PASSWORD}@${ENV.HOST}:${ENV.PORT}/${ENV.DATABASE}/?authSource=admin`;
        console.log(this.dbUri);
    }
    static getInstance(ENV, isAuth = false) {
        return this._instance || (this._instance = new this(ENV, isAuth));
    }
    connect(dataBase, options = { useNewUrlParser: true, useUnifiedTopology: true }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusConnection = yield mongodb_1.MongoClient.connect(this.dbUri, options)
                .then((cnn) => {
                return {
                    status: 'success',
                    connection: cnn,
                    msg: `Servidor Mongo DB corriendo de forma exitosa !!!`
                };
            })
                .catch((error) => {
                console.log(error);
                return {
                    status: 'error',
                    error,
                    msg: 'Ocurrio un error al intentar establecer conexión con el servidor de MongoDB'
                };
            });
            if (this.statusConnection.status == 'success') {
                this.cnn = this.statusConnection.connection;
                this.db = this.cnn.db(dataBase);
            }
            else {
                this.cnn = null;
                this.db = null;
            }
        });
    }
    setDataBase(dataBase) {
        this.db = this.cnn.db(dataBase);
    }
    close() {
        if (this.cnn != null) {
            this.cnn.close();
        }
    }
}
exports.default = MongoDBHelper;
