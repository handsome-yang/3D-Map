/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：纹理多边形
 * 注意事项：该文件方法仅为纹理多边形使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/

var userdataObj = window.dialogArguments;//外部传入参数
var isSubmit = false;//是否点击了确定

function polygon_submit() {
    isSubmit = true;
    if(check()) {
        returnValue();
        window.close();
    }
}
// 获取当前用户对象
function returnValue(){
    if(userdataObj != null) {
        userdataObj.click="true";
        var name=document.getElementById("lineRingName").value;
        userdataObj.name=name;

        var description = document.getElementById("description").value;
        userdataObj.desc=description;

        userdataObj.selectable = document.getElementById("selectable").value;
        userdataObj.editable = document.getElementById("editable").value;

        var transparency = document.getElementById("transparency").value;
        transparency = parseInt(transparency).toString(16);//parseInt(x,16);
        if(transparency.length == 1){
            transparency = "0" + transparency;
        }

        var fillColor = document.getElementById("fillColor").value;
        fillColor = fillColor.substring(1);
        userdataObj.fillcolor = "#" + transparency + fillColor;

        var lineAlpha = document.getElementById("lineAlphaValue").value;
        lineAlpha = parseInt(lineAlpha).toString(16);
        if(lineAlpha.length == 1){
            lineAlpha = "0" + lineAlpha;
        }

        var lineColor = document.getElementById("lineColor").value;
        lineColor = lineColor.substr(1);
        userdataObj.linecolor = "#" + lineAlpha + lineColor;

        var dataProcess=document.getElementById("dataProcess");
        dataProcess.Load();

        var picPath=document.getElementById("picture").value;//
        var texttrue=picPath.split("\\");
        var texttrueFname=texttrue[texttrue.length-1];
        var  rootpath= userdataObj.earth.RootPath+STAMP_config.constants.USERDATA+texttrueFname;
        var a=dataProcess.DataConvert.Convert_File(picPath,rootpath)  ;
        if(a===1){
            picPath=  picPath;
        }else if(a===0){
            picPath=  rootpath;
        } else if(a===-1){
            alert("模型转换没成功！");
            return;
        }
        userdataObj.picture=  picPath;
        userdataObj.textture=document.getElementById("textTure").value ;
        userdataObj.linewidth=document.getElementById("lineWidth").value;
        userdataObj.expandX=document.getElementById("expandX").value;
        userdataObj.expandY=document.getElementById("expandY").value;
        userdataObj.shadow=document.getElementById("shadow").value ;
    }
    return userdataObj;

}
// 给输入值设定范围
function check() {
    if(lineRingName.value=="") {
        alert("名称不能为空!");
        lineRingName.focus();
        return false;
    }
    if(containSpecial(lineRingName.value)){
        alert("名称不能有特殊字符！");
        lineRingName.focus();
        return false;
    }
    var transparencyline = document.getElementById("lineAlphaValue").value;
    if(""==transparencyline) {
        alert("透明度不能为空!");
        document.getElementById("lineAlphaValue").focus();
        return false;
    }
    if (isNaN(transparencyline)) {
        alert("透明度必须是数字！");
        document.getElementById("lineAlphaValue").focus();
        return false;
    }
    if(parseInt(transparencyline) < 0 || parseInt(transparencyline) > 255){
        alert("透明度超出范围！");
        document.getElementById("lineAlphaValue").focus();
        return false;
    }
    var transparency = document.getElementById("transparency").value;
    if(""==transparency) {
        alert("透明度不能为空!");
        document.getElementById("transparency").focus();
        return false;
    }
    if (isNaN(transparency)) {
        alert("透明度必须是数字！");
        document.getElementById("transparency").focus();
        return false;
    }
    if(parseInt(transparency) < 0 || parseInt(transparency) > 255){
        alert("透明度超出范围！");
        document.getElementById("transparency").focus();
        return false;
    }
    var linewidth = document.getElementById("lineWidth").value;
    if ("" == linewidth) {
        alert("请输入线宽！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    if (isNaN(linewidth)) {
        alert("线宽输入不正确！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    if (linewidth<=0) {
        alert("线宽输入不正确！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    
    var picture = document.getElementById("picture").value;
    if (picture == "" || picture == null || picture == undefined) {
        alert("请选择图片");
        return false;
    }
    
    var expandX = document.getElementById("expandX").value;
    if ("" == expandX) {
        alert("请输入横向平铺！");
        document.getElementById("expandX").focus();
        return false;
    }
    if (isNaN(expandX)) {
        alert("横向平铺输入不正确！");
        document.getElementById("expandX").focus();
        return false;
    }
    var expandY = document.getElementById("expandY").value;
    if ("" == expandY) {
        alert("请输入纵向平铺！");
        document.getElementById("expandY").focus();
        return false;
    }
    if (isNaN(expandY)) {
        alert("纵向平铺输入不正确！");
        document.getElementById("expandY").focus();
        return false;
    }
    return true;
}
// 获取用户对象属性
function attributeUserdata(){
    if("add" == userdataObj.action){
        return;
    }else if("edit" == userdataObj.action){

        document.getElementById("lineRingName").value = userdataObj.name;
        
        document.getElementById("lineColor").value ="#"+ userdataObj.linecolor.substring(3);
        document.getElementById("lineWidth").value = userdataObj.linewidth;
        
        document.getElementById("fillColor").value = "#"+userdataObj.FillColor.substring(3);
        document.getElementById("expandX").value = userdataObj.expandX;
        document.getElementById("expandY").value = userdataObj.expandY;
        document.getElementById("textTure").value = userdataObj.textture;
        document.getElementById("picture").value = userdataObj.picture;
        document.getElementById("shadow").value = userdataObj.shadow;
        document.getElementById("description").value = userdataObj.desc;

        document.getElementById("selectable").value = userdataObj.selectable;
        document.getElementById("editable").value = userdataObj.editable;

        var lineColor = userdataObj.linecolor;
        var lineColorLen = lineColor.length;
        if(lineColorLen === 3){
            var colorStr = lineColor.substring(1);
            document.getElementById("lineColor").value = "#" + "0000" +colorStr;
            document.getElementById("lineAlphaValue").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "0000" +colorStr;
        } else if(lineColorLen === 5){
            var colorStr = lineColor.substring(1);
            document.getElementById("lineColor").value = "#" + "00" +colorStr;
            document.getElementById("lineAlphaValue").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "00" +colorStr;
        } else if(lineColorLen === 7) { 
            document.getElementById("lineColor").value = lineColor;
            document.getElementById("lineAlphaValue").value =  0;
            document.getElementById("lineColorSel").style.background = lineColor;
        } else if(lineColorLen === 8) { 
            var colorStr = lineColor.substring(2);
            var HEX = lineColor.substr(1, 1);
            document.getElementById("lineColor").value = "#" +colorStr;
            document.getElementById("lineAlphaValue").value =  parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        } else if(lineColorLen === 9) {
            var colorStr = lineColor.substring(3);
            document.getElementById("lineColor").value = "#" + colorStr;
            var HEX = lineColor.substr(1, 2);
            document.getElementById("lineAlphaValue").value =  parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        }



        //面颜色
        var fillColor;
        var transparency;
        if(userdataObj.type != 220){//不是线条
            fillColor = userdataObj.fillcolor;
            var fillColorLen = fillColor.length;
            if(fillColorLen === 3){
                var colorStr = fillColor.substring(1);
                document.getElementById("fillColor").value = "#" + "0000" +colorStr;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = "#" + "0000" +colorStr;
            } else if(fillColorLen === 5){
                var colorStr = fillColor.substring(1);
                document.getElementById("fillColor").value = "#" + "00" +colorStr;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = "#" + "00" +colorStr;
            } else if(fillColorLen === 7) { 
                document.getElementById("fillColor").value = fillColor;
                document.getElementById("transparency").value =  0;
                document.getElementById("fillColorSel").style.background = fillColor;
            } else if(fillColorLen === 8) { 
                var colorStr = fillColor.substring(2);
                var HEX = fillColor.substr(1, 1);
                document.getElementById("fillColor").value = "#" +colorStr;
                document.getElementById("transparency").value =  parseInt("0x" + HEX);
                document.getElementById("fillColorSel").style.background = "#" +colorStr;
            } else if(fillColorLen === 9) {
                var colorStr = fillColor.substring(3);
                document.getElementById("fillColor").value = "#" + colorStr;
                var HEX = fillColor.substr(1, 2);
                document.getElementById("transparency").value =  parseInt("0x" + HEX);
                document.getElementById("fillColorSel").style.background = "#" +colorStr;
            }
        }
    }
    editablesel();
}

// 纹理是否显示
function textTureOnclick()
{
    
    if (document.getElementById("textTure").options[document.getElementById("textTure").selectedIndex].text == "不显示") {
        document.getElementById("picture").disabled = true;
        document.getElementById("Selected").disabled = true;
        document.getElementById("expandX").disabled = true;
        document.getElementById("expandY").disabled = true;
    } else {
        document.getElementById("picture").disabled = false;
        document.getElementById("Selected").disabled = false;
        document.getElementById("expandX").disabled = false;
        document.getElementById("expandY").disabled = false;
    }
}
/**
 * 添加材质
 */
function addLink() {
    var filePath =  userdataObj.earth.UserDocument.OpenFileDialog( userdataObj.earth.RootPath, "所有支持类型|*.BMP;*.DIB;*.JPG;*.JPEG;*.PNG;*.TIF;*.TIFF;*.GIF|BMP文件(*.BMP;*.DIB)|*.BMP;*.DIB|JPEG文件(*.JPG;*.JPEG)|*.JPG;*.JPEG|PNG文件(*.PNG)|*.PNG");
    if (filePath == "")
        return;
    var fileType = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();
    if ("jpg" == fileType || "jpeg" == fileType || "png" == fileType || "bmp" == fileType || "gif" == fileType) {
        document.getElementById("picture").value = filePath;
    } else {
        alert("支持图片格式为:jpeg,jpg,png,bmp,gif");
    }
}
//取消按钮
function closeWindow(){
    isSubmit = false;
    userdataObj.click="false";
    window.close();
}
// 关闭当前子窗口
function unloadTextureWindow(){
    if(!isSubmit){
        userdataObj.click="false";
    }
}
// 是否能被选中
function editablesel(){
    if(document.getElementById("selectable").value=="false"){
        document.getElementById("editable").selectedIndex=1;
        document.getElementById("editable").disabled=true;
    }
    else{
        document.getElementById("editable").disabled=false;
        document.getElementById("editable").selectedIndex=0;
    }
}
function containSpecial( s ){
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}