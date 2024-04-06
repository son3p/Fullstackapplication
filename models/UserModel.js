import mongoose from 'mongoose'
const Schema = mongoose.Schema;
import passportLocalMongoose from 'passport-local-mongoose';

// Example of associations and populate: https://mongoosejs.com/docs/populate.html
//Ganska bra förklaring https://vegibit.com/mongoose-relationships-tutorial/
// About lean https://mongoosejs.com/docs/tutorials/lean.html

// Remove the ObjectID and change to string
function changeIdType(doc, ret) {
	ret.id = ret._id.toString();
	delete ret._id;
	delete ret.__v;

	return ret;
}

// Define the schema
const UserSchema = new Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true },
	isConfirmed: { type: Boolean, required: true, default: 0 },
	status: { type: Boolean, required: true, default: 1 }
	},
	{
		timestamps: true,
		// When converting mongoose to object change the id
		toObject: {
			transform: changeIdType
		},
		toJSON: {
			transform: changeIdType
		}
	});
	
	// Change _id to id on lean for findOneXxxx
	UserSchema.post(['findOne', 'findOneAndUpdate'], function(ret) {
		if (!ret) 
		  return;
		
		if(this.mongooseOptions().lean) 
			return changeIdType(null, ret);
	  
	});

// this connects passport to our user model
UserSchema.plugin(passportLocalMongoose);

// Define the schema class
const UserModel = mongoose.model("User", UserSchema);

// we export the class
//kw module.exports = UserModel;
export default UserModel