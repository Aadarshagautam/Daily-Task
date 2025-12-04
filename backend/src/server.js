import express from 'express';
import notesRoutes from './routes/notes_routes.js';
import { ConnectDB } from './config/db.js';
import dotenv from 'dotenv'


dotenv.config();

const app= express();
const PORT =process.env.PORT || 5001;
app.use("./api/notes",notesRoutes);

ConnectDB();

app.listen(PORT, ()=>{
    console.log("Server is running on PORT:",PORT);
    
});       
 

// mongodb+srv://aadarshgautam23_db_user:PIZQfcZcVNCSrSnO@cluster0.kc9whs9.mongodb.net/?appName=Cluster0