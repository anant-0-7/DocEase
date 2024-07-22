const mongoose=require("mongoose");

exports.connectMongoose=async()=>{
    await mongoose.connect('mongodb://127.0.0.1:27017/healthapp')
    .then((e)=>console.log("Connected to MongoDB"))
    .catch((e)=>console.error(e));
}

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    usertype:{
        type:String,
        enum:["patient","doctor"],
        default:"patient",
    },
    age:Number,
    bloodGrp:String,
    starttime:String,
    
    contact:{
        type:String,
        required:true,
    },
    ongoingPatient: {
        _id: String,
        appointmentNo: Number,
        appointmentTime: String,
    },
    upcomingPatients:[{
        _id: String,
        appointmentNo:Number,
<<<<<<< HEAD
        appointmentTime: String,
=======
        appointmentDate:Date,
        
>>>>>>> a96f27fd429b38d993acf131b8c9431c5791adf6
    }],
    finishedPatients:[{
        _id: String,
        appointmentNo:Number,
<<<<<<< HEAD
        appointmentTime:String,
=======
        appointmentTime:Date,
>>>>>>> a96f27fd429b38d993acf131b8c9431c5791adf6
    }]

});
exports.User=mongoose.model("User",userSchema);

