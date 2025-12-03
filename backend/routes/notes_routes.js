import express from "express";

const router=express.Router();

router.get("/",(req,res)=>{
    res.status(200).send("You just fetched notes");
});

router.post("/",(req,res)=>{
    res.status(201).json({message:"Notes created successfllu"});
});

    router.put("/:id",(req,res)=>
        {
            //create the notes 
        res.status(200).json({message:"Notes update successfllu"});
        });

        router.delete("/:id",(req,res)=>
            {
                //create the notes 
            res.status(201).json({message:"Notes deleted successfllu"});
            });

export default router