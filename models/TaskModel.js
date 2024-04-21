import mongoose from 'mongoose'
const Schema = mongoose.Schema;

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
const TaskSchema = new Schema({
	task: {type: String, required: false},
    estimated_time: {type: String, required: false},
	priority: { type: String, required: true },
	belongsTo: { type: Schema.ObjectId, ref: "Todo", required: true },
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
	TaskSchema.post(['findOne', 'findOneAndUpdate'], function(ret) {
		if (!ret) 
		  return;
		
		if(this.mongooseOptions().lean) 
			return changeIdType(null, ret);
	  
	});


// Define the schema class
const TaskModel = mongoose.model("Task", TaskSchema);

// we export the class
//kw module.exports = UserModel;
export default TaskModel;