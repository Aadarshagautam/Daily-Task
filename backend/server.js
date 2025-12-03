import express from 'express';
import notesRoutes from './routes/notes_routes.js';





const app= express();
app.use("./api/notes");
 
// app.get("/api/notes",(req,res)=>
// {
//     //send the notes 
//     res.status(200).send("Your got 20 notes");
// });

// app.post("/api/notes",(req,res)=>
//     {
//         //create the notes 
//     res.status(201).json({message:"Notes created successfllu"});
//     });

//     app.put("/api/notes/:id",(req,res)=>
//         {
//             //create the notes 
//         res.status(200).json({message:"Notes update successfllu"});
//         });

//         app.delete("/api/notes/:id",(req,res)=>
//             {
//                 //create the notes 
//             res.status(201).json({message:"Notes deleted successfllu"});
//             });
app.listen(5001, ()=>{
    console.log("Server is running on port 5001");
    
});       
 