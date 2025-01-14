import mongoose from 'mongoose'
const Schema = mongoose.Schema;

// Example of associations and populate: https://mongoosejs.com/docs/populate.html
// Ganska bra förklaring https://vegibit.com/mongoose-relationships-tutorial/
// about lean https://mongoosejs.com/docs/tutorials/lean.html

// Remove the ObjectID and change to string
function changeIdType(doc, ret) {
	ret.id = ret._id.toString();
	delete ret._id;
	delete ret.__v;
    return ret;
}

const TodoSchema = new Schema({
	todo: {type: String, required: true},
    category: {type: String, required: true},
    status: {type: String, required: true},
    created_at: { type: Date, required: false},
	belongsTo: { type: Schema.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.ObjectId, ref: "User", required: true },
    tasks: [{type: Schema.ObjectId, ref: 'Task'}]
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
TodoSchema.post(['findOne', 'findOneAndUpdate'], function(ret) {
    if (!ret) 
      return;
    
    if(this.mongooseOptions().lean) 
        return changeIdType(null, ret);
  
});

// Define the schema class
const TodoModel = mongoose.model("Todo", TodoSchema);

// we export the constructor
//kw module.exports = NoteModel;
export default TodoModel;
