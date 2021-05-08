import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression'
import { Socket } from 'socket.io';
import MongoHelper from './helpers/mongo.helper';
import SocketLogic from './sockets/sockets.logic';
import ENV from './enviroments/env';
import TokenHelper from './helpers/token.helper';
import SocketIO from 'socket.io';

const mongo = MongoHelper.getInstance(ENV.MONGODB,true);
const tokenHelper = TokenHelper(ENV, mongo);

(async() => {
    await mongo.connect(ENV.MONGODB.DATABASE);
    if (mongo.statusConnection.status == 'success') {
        console.log(`Conexión exitosa a MonngoDB en el puerto ${ENV.MONGODB.PORT}`);
        // Correr Express
        const app = express();
        app.use(express.json());
        app.use(compression());
        app.use(cors({origin:true, credentials:true}));
        //app.use(cors({origin: true, credentials: true}));

        app.get('/', (req: Request, res: Response) => {
            res.status(200).json({
                ok: true,
                msg: 'API Real-Time funcionando correctamente'
            });
        });

        const httpServer = http.createServer(app);
        const socketIO = require('socket.io')(httpServer,{
            cors: {
            origin: ["http://localhost:4200","http://www.teresalfaro.me"]
            },
            allowEIO3: true
            });

        // Funcionalidad Real-Time
        const socketLogic = SocketLogic(mongo);
        socketIO.on('connection', (socket: Socket) => {
            // TO DO: Lógica Real-Time
            console.log(`Nuevo cliente conectado con ID: ${socket.id}`);

            socketLogic.actualizarCorreo(socketIO,socket);
            socketLogic.logOut(socketIO,socket);
            socketLogic.signIn(socketIO, socket);
            socketLogic.disconnect(socketIO,socket);
        });

        httpServer.listen(ENV.API.PORT, () => {
            console.log(`Servidor Express funcionando correctamente en puerto ${ENV.API.PORT}`);
        });

    } else {
        console.log('No se pudo establecer conexión co la base de datos');
    }
})();

// Handle Errors 
process.on('unhandleRejection', (error: any, promise) => {
    console.log(`Ocurrio un error no controlado de tipo promise rejection`, promise);
    console.log(`La descripción de error es la siguiente`, error);
    // Close MongoDB
    mongo.close();
    process.exit();
});