const express =require('express') ;
const bodyParser=require ('body-parser');
const {User,connectMongoose}=require("./models/database.js");
const session=require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const path=require("path");
const {initializePassport,isAuthenticatedDoctor,isAuthenticatedPatient}=require("./passportConfig.js");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");


const port = 3000;
const app = express();

const sessionOptions={
    secret:"SECRET",
    resave:false,
    saveUninitialized:false,
};

app.use(flash());
app.use(session(sessionOptions));

connectMongoose();
initializePassport(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname,"public")));






app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
})

app.get("/", (req,res)=>{

    res.render("index.ejs");

})

app.post("/doctor",passport.authenticate("local",{failureRedirect:"/doctor",failureFlash:true}),wrapAsync(async(req,res)=>{
    req.flash("success","Welcome to BookaDR,You are Logged in.");
    let userid=req.user._id;
    let redirectUrl=`/doctor/${userid}`
    res.redirect(redirectUrl);
}))

app.get("/doctor", (req,res)=>{
    res.render("login_doctor.ejs");
})

app.post("/patient",passport.authenticate("local",{failureRedirect:"/patient",failureFlash:true}),wrapAsync(async(req,res)=>{
    req.flash("success","Welcome to BookaDR,You are Logged in.");
    let userid=req.user._id;

    let redirectUrl=`/patient/${userid}`
    res.redirect(redirectUrl);
}));

app.get("/patient", (req,res)=>{
    res.render("login_patient.ejs");
})



app.get("/doctor/:id", isAuthenticatedDoctor,wrapAsync(async (req, res)=>{
    var id = req.params.id;
    var doc = await User.findById(id);
    console.log(doc);
    var patient;
    if(doc.ongoingPatient) patient = await User.findById(doc.ongoingPatient._id);
    else patient = false;
    res.render("doctor.ejs", {id: req.params.id, patient: patient, doc:doc});
}));


app.get("/doctor/done/:id", async (req, res)=>{
    var id = req.params.id;
    var doc = await User.findById(id);
    let arr = doc.upcomingPatients;
    let nextPatient = {};
    if(arr.length) {
        nextPatient = arr[0];
        arr.shift();
    }

    let update = await User.updateOne({_id: id}, {upcomingPatients: arr});
    console.log(update.acknowledged); // Boolean indicating everything went smoothly.

    if(doc.ongoingPatient){
        let prevArr = doc.finishedPatients;
        prevArr.push(doc.ongoingPatient);
        let update2 = await User.updateOne({_id: id}, {finishedPatients: prevArr});
        console.log(update2.acknowledged);

    }

    let update3 = await User.updateOne({_id: id}, {ongoingPatient: nextPatient});
    console.log(update3.acknowledged);
    

    

    res.redirect(`/doctor/${id}`);


})












app.listen(port, () => {
  console.log(`App is running on PORT ${port}`);
});