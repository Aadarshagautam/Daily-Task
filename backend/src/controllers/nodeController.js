export function getAllNotes(req,res){
    res.status(200).send("You just fetched notes");
} 

export function createAllNotes(req,res){
    res.status(201).json({message:"Notes created successfllu"});
}

export function updateAllNotes(req,res){
    //create the notes 
res.status(200).json({message:"Notes update successfllu"});
}
export function deleteAllNotes(req,res){
    //create the notes 
res.status(201).json({message:"Notes deleted successfllu"});
}