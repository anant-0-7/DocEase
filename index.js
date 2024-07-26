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
const { v4: uuidv4 } = require('uuid');


const port = 3000;
const app = express();

const sessionOptions={
    secret:"SECRET",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+1000*60*60*24*3,
        maxAge:1000*60*60*24*3,
        httpOnly:true
    }
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
    req.flash("success","Welcome to DocEase,You are Logged in.");
    let userid=req.user._id;
    let redirectUrl=`/doctor/${userid}`
    res.redirect(redirectUrl);
}))

app.get("/doctor", (req,res)=>{
    res.render("login_doctor.ejs");
})

app.post("/patient",passport.authenticate("local",{failureRedirect:"/patient",failureFlash:true}),wrapAsync(async(req,res)=>{
    req.flash("success","Welcome to DocEase,You are Logged in.");
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
    var patient;
    if(doc.ongoingPatient) patient = await User.findById(doc.ongoingPatient._id);
    else patient = false;
    res.render("doctor.ejs", {id: req.params.id, patient: patient, doc:doc});
}));


app.get("/doctor/done/:id",isAuthenticatedDoctor, wrapAsync(async (req, res)=>{
    var id = req.params.id;
    var doc = await User.findById(id);
    let arr = doc.upcomingPatients;
    let nextPatient = {};
    if(arr.length) {
        nextPatient = arr[0];
        arr.shift();
    }

    let update = await User.updateOne({_id: id}, {upcomingPatients: arr});

    if(doc.ongoingPatient){
        let prevArr = doc.finishedPatients;
        prevArr.push(doc.ongoingPatient);
        let update2 = await User.updateOne({_id: id}, {finishedPatients: prevArr});
        

    }

    let update3 = await User.updateOne({_id: id}, {ongoingPatient: nextPatient});

    

    

    res.redirect(`/doctor/${id}`);


}));




app.get("/doctor/prev/:id",isAuthenticatedDoctor, wrapAsync(async(req, res)=>{
    var id = req.params.id;
    var doc =  await User.findById(id);
    var arr = [];

    for(const element of doc.finishedPatients){
        var temp = await User.findById(element._id).exec();
        temp.appointmentTime = element.appointmentTime;
        temp.appointmentNo = element.appointmentNo;
        arr.push(temp);
    }
    res.render("doctor_other.ejs", {id:id, name:doc.name,hospitalName:doc.hospitalName, prev: true, arr: arr})
}));

app.get("/doctor/upcoming/:id", isAuthenticatedDoctor,wrapAsync(async(req, res)=>{
    var id = req.params.id;
    var doc =  await User.findById(id);
    var arr = [];

    for(const element of doc.upcomingPatients){
        var temp = await User.findById(element._id).exec();
        temp.appointmentTime = element.appointmentTime;
        temp.appointmentNo = element.appointmentNo;
        arr.push(temp);
    }


    res.render("doctor_upcoming.ejs", {id:id, name:doc.name,hospitalName:doc.hospitalName, prev: false, arr: arr})
}))

app.get("/doctor/delete/:id1/patient/:id2",isAuthenticatedDoctor, wrapAsync(async (req, res)=>{
    var docid = req.params.id1;
    var patientid=req.params.id2;
    var doc = await User.findById(docid);
    let arr = doc.upcomingPatients;
    let sind=0;
    let l=arr.length;
    let ind=0;
    for(let i=0;i<l;i++){
        if(arr[i]._id==patientid){
            ind=i;
            sind++;
            break;
        }
        sind++;
    }
    for(let i=sind;i<l;i++){
        arr[i].appointmentNo=arr[i].appointmentNo-1;
        
        if(Math.floor(arr[i].appointmentNo/4)==0){
            arr[i].appointmentTime=doc.starttime;
        }
        else{
            arr[i].appointmentTime=doc.starttime+"+"+Math.floor(arr[i].appointmentNo/4)*5+"min";
        }
    }
    arr.splice(ind,1);
    
    let update = await User.updateOne({_id: docid}, {upcomingPatients: arr});
    res.redirect(`/doctor/upcoming/${docid}`);
}));


app.get("/doctor/update/:id1/patient/:id2",isAuthenticatedDoctor,wrapAsync(async (req, res)=>{
    var docid = req.params.id1;
    var patientid=req.params.id2;
    var doc = await User.findById(docid);
    let arr = doc.upcomingPatients;
    
    let sind=0;
    
    for(let i=0;i<arr.length;i++){
        if(arr[i]._id==patientid && arr.length-sind>=3){
            arr[i].appointmentNo=arr[i].appointmentNo+2;
            if(Math.floor(arr[i].appointmentNo/4)==0){
                arr[i].appointmentTime=doc.starttime;
            }
            else{
                arr[i].appointmentTime=doc.starttime+"+"+Math.floor(arr[i].appointmentNo/4)*5+"min";
            }
            sind++;
            break;
        }
        sind++;
    }
    if(arr.length-sind>=2){
        for(let i=sind;i<sind+2;i++){
        
            console.log(arr[i]);
            arr[i].appointmentNo=(arr[i].appointmentNo)-1;
            
            if(Math.floor((arr[i].appointmentNo)/4)==0){
                arr[i].appointmentTime=doc.starttime;
            }
            else{
                arr[i].appointmentTime=doc.starttime+Math.floor((arr[i].appointmentNo)/4)+"min";
            }
        
        }
        arr.sort(function(a, b) {
        
            var keyA = a.appointmentNo,
                keyB = b.appointmentNo;
                console.log(arr[0]);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
    }
    let update = await User.updateOne({_id: docid}, {upcomingPatients: arr});
    res.redirect(`/doctor/upcoming/${docid}`);
}));

app.get("/patient/:id", isAuthenticatedPatient,wrapAsync(async (req, res)=>{
    var id = req.params.id;
    var patient = await User.findById(id);
    var doctors = await User.find({
        $or: [
            { upcomingPatients: { $elemMatch: { _id: id } } },
            { "ongoingPatient._id": id }
        ]
    });
    doctors.forEach(element=>{
        element.upcomingPatients=element.upcomingPatients.filter((ele)=>ele._id==id)
    })

    res.render("patient.ejs",{id:id,arr:doctors,prev:false,name:patient.name,patient});
    
}));


app.get("/patient/prev/:id", isAuthenticatedPatient,wrapAsync(async (req, res)=>{
    var id = req.params.id;
    var patient = await User.findById(id);
    var doctors=await User.find( { finishedPatients: { $elemMatch: { _id:id}}});
    doctors.forEach(element=>{
        element.finishedPatients=element.finishedPatients.filter((ele)=>ele._id==id)
    })

    res.render("patientpast.ejs",{id:id,arr:doctors,prev:true,name:patient.name,patient});
    
}));


app.get("/patient/:id1/view/:id2",isAuthenticatedPatient,wrapAsync(async (req, res)=>{
    var id1 = req.params.id1;
    var id2 = req.params.id2;
    var doctor = await User.findById(id1);
    var patientid;
    var appointmentNo;
    var appointmentTime;
    var appointmentDate;
    doctor.finishedPatients.forEach(element=>{
        if(element.appid==id2){
            patientid=element._id;
            appointmentNo=element.appointmentNo;
            appointmentTime=element.appointmentTime;
            appointmentDate=element.appointmentDate;
        }
    })
    var patient= await User.findById(patientid);
    res.render("viewPage.ejs",{doctor,patient,appointmentNo,appointmentTime,appointmentDate});
  
    
}));



app.get("/patient/book/:id", isAuthenticatedPatient,wrapAsync(async(req, res)=>{

    var id = req.params.id;
    var doctors = await User.find({usertype:"doctor"});
    var patient = await User.findById(id);
    res.render("book.ejs", {doc: doctors, id:id, name:patient.name});

}))

app.get("/patient/:id1/book/:id2", isAuthenticatedPatient, wrapAsync(async(req, res)=>{
        var id1 = req.params.id1;
        var id2 = req.params.id2;
        var doc = await User.findById(id2);
        
        var isBooked = false;
        console.log(doc);
        if(doc.ongoingPatient._id == id1) isBooked = true;

        var arr = doc.upcomingPatients;
        arr.forEach(element=>{
            if(element._id ==id1){
                isBooked = true;
            }
        })

        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); 
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;

        var num;

        if(arr.length){
            num = arr[arr.length-1].appointmentNo+1;
        }
        else if(doc.ongoingPatient._id) num = doc.ongoingPatient.appointmentNo+1;
        
        else num = 1;

        var time;
        if(num%3==0) time = (Math.floor(num/3)-1)*15;
        else time = (Math.floor(num/3))*15;

        const newPatient = {
            _id: id1,
            appid: uuidv4(),
            appointmentDate: today,
            appointmentNo: num,
            appointmentTime: doc.starttime +"+"+ time + " min"

        }

        if(arr.length || doc.ongoingPatient._id){
            arr.push(newPatient);
            let tmp = await User.updateOne({_id:id2}, {upcomingPatients:arr});
        }
        else{
            let tmp = await User.updateOne({_id: id2}, {ongoingPatients: newPatient});
        }

        if(isBooked) {
            req.flash("error","Appointment Already Booked");
            res.redirect(`/patient/${id1}`);}
        else {
            if(arr.length || doc.ongoingPatient._id){
                arr.push(newPatient);
                let tmp = await User.updateOne({_id:id2}, {upcomingPatients:arr});
            }
            else{
                let tmp = await User.updateOne({_id: id2}, {ongoingPatient: newPatient});
            }
            req.flash("success","Booked Successfully");
            res.redirect(`/patient/${id1}`);
        }


}))



app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are Logged out successfully");
        res.redirect("/");
    })
})


app.listen(port, () => {
  console.log(`App is running on PORT ${port}`);
});