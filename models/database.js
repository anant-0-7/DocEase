const mongoose=require("mongoose");

exports.connectMongoose=async()=>{
    await mongoose.connect('mongodb://127.0.0.1:27017/healthapp')
    .then((e)=>console.log("Connected to MongoDB"))
    .catch((e)=>console.log(e));
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
    daytime:String,
    appointmentNo:Number,
    appointmentTime:Date,
    contact:{
        type:String,
        required:true,
    },
    upcomingPatients:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    finishedPatients:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]

});
exports.User=mongoose.model("User",userSchema);

