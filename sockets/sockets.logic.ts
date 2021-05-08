import { Socket } from "socket.io";
import jwt from 'jsonwebtoken';
import TokenHelper from '../helpers/token.helper';
import MongoHelper from '../helpers/mongo.helper';
import ENV from '../enviroments/env';

const mongo = MongoHelper.getInstance(ENV.MONGODB);
const tokenHelper=TokenHelper(ENV,mongo);

export default (mongo: any) => {

    return {
        actualizarCorreo: async(io:any,socket: Socket) => {
            socket.on('actualizarCorreo', async(payload:any)=>{

                try {
                    let result :any= await tokenHelper.verify(payload.token,payload.apiKey);
                    let sockets = await mongo.db.collection('sockets').findOne({correo:result.tokenDecoded.correo});
                    if(result.ok==true && !sockets){
                        await mongo.db.collection('sockets').insertOne({
                            socketId:[socket.id],
                            correo:result.tokenDecoded.correo,
                        });
                    }

                    else if(result.ok==true && sockets){
                        await mongo.db.collection('sockets').findOneAndUpdate({
                            _id:sockets._id
                        },
                        { $push: { socketId: socket.id } });
                    }
                    let conectados = await mongo.db.collection('sockets').find({}).toArray();
                    io.emit('broadcast-message',conectados);

                } catch (error) {
                    console.log(error);
                }
                
            });
        },
        signIn: (io: any, socket: Socket) => {
            socket.on('signIn', async (payload: any) => {
                // Guardar en Base de Datos

                try {
                    let result = await mongo.db.collection('usuarios')
                    .findOneAndUpdate(
                        { correo: payload.email }, // Criterio de Busqueda
                        {
                            $set: {
                                nombreCompleto: payload.displayName,
                                fotoURL: payload.phtoURL
                            }
                        },
                        {
                            upsert:true
                        }
                    )

                    const token:any = await tokenHelper.create({
                        correo:payload.email,
                        nombreCompleto:payload.displayName,
                        fotoUrl:payload.phtoURL 
                    }, payload.apiKey);

                    if(token.ok == true)
                    io.to(socket.id).emit('token',token.token);
                    //Guardar en base de datos cliente conectado
                } catch (error) {
                    console.log(error);
                }
                
            });
        },
        logOut: (io:any,socket:Socket) => {
            socket.on('logOut',async (payload:any)=>{
                try {
                    let token:any = await tokenHelper.verify(payload.token,payload.apikey);
                    if(token.ok == true){
                        let result = await mongo.db.collection('sockets').findOne({correo:token.tokenDecoded.correo});
                        if(result){
                            if(result.socketId.length>1)
                            {
                                await mongo.db.collection('sockets').findOneAndUpdate(
                                    {_id:result._id},
                                    { $pull: { socketId: socket.id } },
                                    { multi: true }
                                )
                            }
                            else{
                                await mongo.db.collection('sockets').deleteOne({_id:result._id});
                            }
                        }
                        const conectados = await mongo.db.collection('sockets').find({}).toArray();
                        io.emit('broadcast-message',conectados)
                    }
                } catch (error) {
                    console.log(error);
                }
            });
        },
        disconnect: (io:any,socket: Socket) => {
            socket.on('disconnect', async () => {

                try {
                    console.log(`Desconexión del cliente con ID: ${socket.id}`);
                    // Eliminar Socket Desconectado
                    let result = await mongo.db.collection('sockets').findOne({socketId: socket.id});
                    if(result){
                        if(result.socketId.length>1)
                            {
                                await mongo.db.collection('sockets').findOneAndUpdate(
                                    {_id:result._id},
                                    { $pull: { socketId: socket.id } },
                                    { multi: true }
                                )
                            }
                        else{
                            await mongo.db.collection('sockets').deleteOne({_id:result._id});
                        }
                        const conectados = await mongo.db.collection('sockets').find({}).toArray();
                        io.emit('broadcast-message',conectados)
                    }
                } catch (error) {
                    console.log(error);
                }
                // TO DO: Guardar Log en Base de Datos
            });
        }
    }
};