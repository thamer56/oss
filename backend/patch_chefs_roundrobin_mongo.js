require('dotenv').config();
const mongoose = require('mongoose');

// Models
const projectSchema = new mongoose.Schema({}, { strict: false, collection: 'users' }); // Swapped
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'projets' }); // Swapped

const Project = mongoose.model('Project', projectSchema);
const User = mongoose.model('User', userSchema);

const dbURI = "mongodb+srv://admin_pfe:50611477@cluster0.ooyzlhe.mongodb.net/oss?retryWrites=true&w=majority";

async function reassign() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");
        
        const divisions = ['D01', 'D02', 'D03', 'D04'];
        
        for (const div of divisions) {
            const projects = await Project.find({ division_id: div }).sort({ id_projet: 1 }).lean();
            const chefs = await User.find({ division_id: div, role: 'chef_projet' }).sort({ username: 1 }).lean();
            
            if (projects.length === 0 || chefs.length === 0) continue;
            
            for (let i = 0; i < projects.length; i++) {
                const proj = projects[i];
                const chefId = chefs[i % chefs.length].id_user;
                
                await Project.updateOne(
                    { _id: proj._id },
                    { $set: { chef_projet_id: chefId } }
                );
                console.log(`Updated project ${proj.id_projet} -> ${chefId}`);
            }
        }
        
        console.log('Successfully reassigned all projects uniformly!');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

reassign();
