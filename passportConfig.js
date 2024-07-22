const LocalStrategy=require("passport-local");
const {User}=require("./models/database.js");


exports.initializePassport=(passport)=>{
    passport.use(new LocalStrategy(async(username,password,done)=>{
        try {
            const user= await User.findOne({username});

            if(!user) return done(null,false);

            if(user.password!==password)return done(null,false);

            return done(null,user);
        } catch (error) {
            return done(error,false);
        }
    }))

    passport.serializeUser((user,done)=>{
        done(null,user.id);
    });

    passport.deserializeUser(async(id,done)=>{
        try{
            const user=await User.findById(id);
            done(null,user);
        }
        catch(err){
            done(err,false);
        }
        
    });


}