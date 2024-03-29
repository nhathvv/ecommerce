const mongoose = require("mongoose");
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const productSchema = new mongoose.Schema({
    title : String,
    product_category_id : {
        type : String,
        default : ""
    },
    description : String,
    price: Number,
    discountPercentage: Number,
    stock:Number,
    thumbnail: String,
    featured : String,
    status: String,
    position: Number,
    slug: { 
        type: String,
        slug: "title",
        unique: true
     },
    deleted : {
        type : Boolean,
        default : false
    },
    createdBy : {
        account_id: String,
        createdAt : {
            type : Date,
            default : Date.now
        }
    },
    updatedBy : [{
        account_id : String,
        updatedAt : {
            type : Date,
            default : Date.now
        }
    }],
    deletedBy : {
        account_id: String,
        deletedAt : {
            type : Date,
            default : Date
        }
    },    
},{timestamps : true});
const Product = mongoose.model('Product', productSchema,"products");
module.exports = Product;