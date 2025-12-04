import express from 'express';
import notesRoutes from './routes/notes_routes.js';





const app= express();
app.use("./api/notes",notesRoutes);
app.use("./api/products",productRoutes);
 

app.listen(5001, ()=>{
    console.log("Server is running on port 5001");
    
});       
 

// mongodb+srv://aadarshgautam23_db_user:PIZQfcZcVNCSrSnO@cluster0.kc9whs9.mongodb.net/?appName=Cluster0