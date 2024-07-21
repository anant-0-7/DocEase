import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static('public'));
const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get("/", (req,res)=>{

    res.sendFile(__dirname+ '/public/html/homepage.html');

})

app.get("/doctor", (req,res)=>{
    res.render("login_doctor.ejs");
})

app.get("/patient", (req,res)=>{
    res.render("login_patient.ejs");
})











app.listen(port, () => {
  console.log(`App is running on PORT ${port}`);
});