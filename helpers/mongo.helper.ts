import { MongoClient, MongoClientOptions } from 'mongodb'


export default class MongoDBHelper{

    public db:any;
    public statusConnection:any = {};

    private static _instance: MongoDBHelper;
    private cnn: any;
    private dbUri: string = '';

    constructor(ENV:any, isAuth: boolean = false){
        //this.dbUri = `mongodb://${ENV.HOST}:${ENV.PORT}/${ENV.DATABASE}`;
        this.dbUri = `mongodb://${ENV.USER_NAME}:${ENV.USER_PASSWORD}@${ENV.HOST}:${ENV.PORT}/${ENV.DATABASE}/?authSource=admin`
        
        console.log(this.dbUri);
    }

    public static getInstance(ENV:any, isAuth:boolean = false){
        return this._instance || (this._instance = new this(ENV, isAuth));
    }

    public async connect(dataBase:string, options: MongoClientOptions={useNewUrlParser:true, useUnifiedTopology:true}){
        this.statusConnection = await MongoClient.connect(this.dbUri, options)
        .then((cnn:any)=>{
            return{
                status:'success',
                connection:cnn,
                msg:`Servidor Mongo DB corriendo de forma exitosa !!!`
            }
        })
        .catch((error:any) => {
            console.log(error);
            return{
                status:'error',
                error,
                msg:'Ocurrio un error al intentar establecer conexión con el servidor de MongoDB'
            }
        });

        if (this.statusConnection.status == 'success') {
            this.cnn = this.statusConnection.connection;
            this.db = this.cnn.db(dataBase);
        } else {
            this.cnn = null;
            this.db = null;
        }
    }

    public setDataBase(dataBase: string) {
        this.db = this.cnn.db(dataBase);
    }

    public close() {
        if (this.cnn != null) {
            this.cnn.close();
        }
    }
}