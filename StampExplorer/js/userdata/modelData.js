/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：添加模型
 * 注意事项：该文件方法仅为添加模型使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/

var userdataObj = window.dialogArguments;
var earth = userdataObj.earth;
var isSubmit = false;

var usbFormatStr = "(*.usb)|*.usb|";
var usbFormat = "usb";

var usxFormatStr = "(*.usx)|*.usx";
var usxFormat = "usx";

var usbAndUsxFormatStr = "(*.usb)|*.usb;|(*.usx)|*.usx";
var usbAndUsxFormat = "usb,usx";

var formatStr;
var format;

function model_submit(){
    isSubmit = true;
    var modelUtil;

    if(check()) {
        if(userdataObj != null) {
            document.getElementById("modelName").disabled = true;
            document.getElementById("link").disabled = true;
            document.getElementById("linkImg").disabled = true;
            document.getElementById("description").disabled = true;
            document.getElementById("submitAdd").disabled = true;
            document.getElementById("clear").disabled = true;
            userdataObj.click="true";
            userdataObj.name = document.getElementById("modelName").value;
            userdataObj.desc = document.getElementById("description").value;
            var link = document.getElementById("link").value;
            var dataProcess=document.getElementById("dataProcess");//将图片格式转换成规定格式并保存到temp/picture下面
            dataProcess.Load();
            if(link!=null&&link!=""){
                var texttrue=link.split("\\");
                var texttrueFname=texttrue[texttrue.length-1];
                var  rootpath= userdataObj.earth.RootPath+STAMP_config.constants.USERDATA+texttrueFname;
                if(link===rootpath){
                    texttrueFname="i"+texttrueFname;
                    rootpath=userdataObj.earth.RootPath+texttrueFname;
                }
                var rootpath2 = earth.RootPath + "userdata";
                var singleimport = dataProcess.SingleMeshImport;
                singleimport.Set_Save_Type(0);
                singleimport.Set_Desc_Path(rootpath2);
                singleimport.Init();

                var texttrue = link.split("\\");
                var texttrueFname = texttrue[texttrue.length-1];
                var fileName = texttrueFname.split(".")[0];
                var folderName = link.substring(0, link.lastIndexOf("."));
                var nFolder =folderName.replace(fileName, "");
                
                modelUtil = singleimport.Process_File_Local(nFolder, texttrueFname);
            }
            if(modelUtil){
                userdataObj.link=modelUtil.path;
            }
            window.close();
        }
    }
}
// 离开当前窗口时
function unloadWindow(){
    if(!isSubmit){
        userdataObj.click="false";
    }
}
function check(){
    var modelName = document.getElementById("modelName").value;
    if("" == modelName){
        alert("请输入名字！");
        return false;
    }
    var link = document.getElementById("link").value;
    if("" == link){
        alert("请选择连接！");
        return false;
    }
    return true;
}
function model_close(){
    isSubmit = false;
    userdataObj.click="false";
    window.close();
}

function addLink(){
    //第三个参数设置为true时 可以多选 但是有问题 窗口模态显示问题!
    var fileName = earth.UserDocument.OpenFileDialog(earth.Environment.RootPath, formatStr);
    if(fileName == "")return;
    var fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    //edit by yzp 2014-08-04 17:40 添加小品时可以添加usx格式文件
    if(format.indexOf(fileType)>-1){
        document.getElementById("link").value = fileName;
        document.getElementById("submitAdd").disabled = false;
    }else{
        alert("格式不正确，支持格式为:"+ format);
    }
}

//连接点击事件
$("#linkImg").click(function(){
    addLink();
});

//确定点击事件
$("#submitAdd").click(function(){
    model_submit();
});

//确定点击事件
$("#clear").click(function(){
    model_close();
});

//初始化数据
function attribute(){
    switch(userdataObj.flag){
        case  "model" :
            formatStr = usbFormatStr;
            format = usbFormat;
            break;
        case  "tree" :
            formatStr = usxFormatStr;
            format = usxFormat;
            break;
        case  "furniture" :
            formatStr = usbAndUsxFormatStr;
            format = usbAndUsxFormat;
            break;
    }

    if("add" == userdataObj.action){
        document.getElementById("modelName").value =userdataObj.name;
        return;
    }else if("edit" == userdataObj.action){
        document.getElementById("modelName").value =userdataObj.name;
        document.getElementById("link").value = userdataObj.link;
        document.getElementById("link").disabled = true;
        document.getElementById("description").value = userdataObj.desc;
        document.getElementById("submitAdd").disabled = false;
        document.getElementById("linkImg").disabled = true;
    }
}