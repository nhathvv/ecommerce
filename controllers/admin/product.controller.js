const Product = require("../../models/product.model")
const Account = require("../../models/account.model")
const ProductCategory = require("../../models/products-category.model")
const systemConfig = require('../../config/system')
const filerStatusHelper = require("../../helpers/filterStatus")
const searchHelper = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")
const createTreeHelper = require("../../helpers/createTree")

// [GET]: /admin/products
const index = async (req, res) => {
    const filterStatus = filerStatusHelper(req.query)
    let find = {
        deleted : false
    }
    if(req.query.status) {
        find.status = req.query.status
    }
    // Search
    const objectSearch = searchHelper(req.query);
    if(req.query.keyword) {
        find.title = objectSearch.regex
    }
    // Pagination
    const countProduct = await Product.countDocuments(find);
    const objectPagination = paginationHelper({
        currentPage  : 1,
        limitItems : 4
    }, req.query, countProduct)

    // Sort
    let sort = {}
    if(req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue
    }else {
        sort.position = "desc"
    }
    // End sort
    const products = await Product.find(find)
        .sort(sort)
        .limit(objectPagination.limitItems)
        .skip(objectPagination.skip)
    for (const product of products) {
        const user = await Account.findOne({
            _id : product.createdBy.account_id,
        })
        if(user) {
            product.accountfullName = user.fullName;
        }

        const updatedBy = product.updatedBy[product.updatedBy.length - 1]
        if(updatedBy) {
            const userUpdated = await Account.findOne( {
                _id : updatedBy.account_id,
            }).select("-password")
            updatedBy.accountFullName = userUpdated.fullName
        }
    }
    res.render("admin/pages/products/index",{
        pageTitle : "Danh sách sản phẩm",
        products : products,
        filterStatus : filterStatus,
        keyword : objectSearch.keyword,
        pagination : objectPagination
    })
}
// [PATCH] /admin/products/change-status/:status/:id
const changeStatus = async(req,res) => {
    const updatedBy = {
        account_id : res.locals.user.id,
        updatedAt : new Date()
    }
    const status = req.params.status;
    const id = req.params.id;
    await Product.updateOne({_id : id}, {status:status,$push: { updatedBy: updatedBy }})
    req.flash('success', 'Cập nhật trạng thái thành công!');
    res.redirect('back')
}
// [PATCH] /admin/products/change-multi
const changeMulti = async(req, res) => {
    const updatedBy = {
        account_id : res.locals.user.id,
        updatedAt : new Date()
    }
    const type = req.body.type;
    const ids = req.body.ids.split(",");
    switch (type) {
        case "inactive":
            await Product.updateMany({_id :  {$in : ids}}, {status:"inactive",$push: { updatedBy: updatedBy }})
            req.flash('success',`Cập nhật trạng thái cho ${ids.length} sản phẩm thành công`);
            break;
        case "active":
            await Product.updateMany({_id :  {$in : ids}}, {status:"active",$push: { updatedBy: updatedBy }})
            req.flash('success',`Cập nhật trạng thái cho ${ids.length} sản phẩm thành công`);
            break;
        case "delete-all":
            await Product.deleteMany({_id :  {$in : ids}});
            // await Product.updateMany({_id :  {$in : ids}}, {deleted : true, deletedBy : {
            //     account_id : res.locals.user.id,
            //     deletedAt : new Date()
            // }})
            req.flash('success',`Đã xóa ${ids.length} sản phẩm thành công`);
            break;
        case "change-position":
            for (const item of ids) {
                let [id,position] = item.split("-");
                position = parseInt(position);
                await Product.updateOne({_id : id}, {position:position,$push: { updatedBy: updatedBy }})
            }
            req.flash('success',`Cập nhật ví trí cho ${ids.length} thành công`);
            break;
        default:
            break;
    }
    res.redirect('back')
}
// [DELETE] /admin/products/delete/:id
const deleteItem = async(req,res) => {
    const id = req.params.id;
    // Permanently deleted
    await Product.deleteOne({_id : id})
    // Soft erase
    // await Product.updateOne({_id: id}, {deleted : true
    //     ,deletedBy : {
    //         account_id : res.locals.user.id,
    //         deletedAt : new Date()
    //     }})
    res.redirect('back')
}
// [GET] /admin/products/create
const create = async(req,res) =>{
    let find = {
        deleted : false
    }
    const category = await ProductCategory.find(find)
    const newCategory = createTreeHelper.tree(category)
    res.render("admin/pages/products/create",{
        pageTitle : "Thêm mới sản phẩm",
        category : newCategory
    })
}
// [POST] /admin/products/create
const createProduct = async(req,res) => {
    req.body.price = parseInt(req.body.price)
    req.body.discountPercentage = parseInt(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    if(req.body.position == "") {
        const countProduct = await Product.countDocuments({})
        req.body.position = countProduct + 1;
    }else {
        req.body.position = parseInt(req.body.position);
    }
    req.body.createdBy = {
        account_id : res.locals.user.id
    }
    const product = new Product(req.body);
    await product.save();

    res.redirect(`${systemConfig.prefixAdmin}/products`)
}
// [GET] /admin/products/edit/:id
const edit = async(req,res) => {
   try {
    const id = req.params.id;
    let find = {
        deleted : false,
        _id : id
    }
    const product = await Product.findOne(find);
    const category = await ProductCategory.find({deleted : false})
    const newCategory = createTreeHelper.tree(category)
    res.render("admin/pages/products/edit",{
        pageTitle : "Chỉnh sửa sản phẩm",
        product : product,
        category : newCategory,
    })
   } catch (error) {
    res.redirect(`${systemConfig.prefixAdmin}/products`)
   }
}
// [PATCH] /admin/products/edit/:id
const editProduct = async (req,res) => {
    const updatedBy = {
        account_id : res.locals.user.id,
        updatedAt : new Date()
    }
    const id = req.params.id
    req.body.price = parseInt(req.body.price)
    req.body.discountPercentage = parseInt(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    req.body.position = parseInt(req.body.position);
    if(req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`
    }
    try {
        await Product.updateOne(
            { _id: id },
            {...req.body, $push: { updatedBy: updatedBy } }
          );
        req.flash("success", "Cập nhật sản phẩm thành công!")
    } catch (error) {
        req.flash("error", "Cập nhật sản phẩm thất bại!")
    }
    res.redirect(`${systemConfig.prefixAdmin}/products`)
}
// [GET] /admin/products/detail/:id
const detail = async(req,res) => {
    try {
        const id = req.params.id;
        let find = {
            deleted : false,
            _id : id
        }
        const product = await Product.findOne(find);
        res.render("admin/pages/products/detail",{
            pageTitle : product.title,
            product : product
        })
       } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/products`)
       }
}

module.exports = {
    index,
    changeStatus,
    changeMulti,
    deleteItem,
    create,
    createProduct,
    edit,
    editProduct,
    detail
}