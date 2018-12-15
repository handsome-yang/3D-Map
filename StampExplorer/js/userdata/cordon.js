/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：警戒线
 * 注意事项：该文件方法仅为警戒线使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var userdataObj = window.dialogArguments;//窗口传的参数
    returnValue = null;//返回参数

/**
 *初始化将值放在框中
 */

function init(){
    if(userdataObj){
        if (userdataObj.name) {
            document.getElementById("lineRingName").value = userdataObj.name;
        }
        if(userdataObj.columradius){
            document.getElementById("radius").value = userdataObj.columradius;
        }
        if(userdataObj.columHeight){
            document.getElementById("columHeight").value = userdataObj.columHeight;
        }
        if(userdataObj.bannerWidth){
            document.getElementById("bannerWidth").value = userdataObj.bannerWidth;
        }
        if(userdataObj.bannerHeight){
            document.getElementById("bannerHeight").value = userdataObj.bannerHeight;
        }
        if(userdataObj.texture){
            document.getElementById("texture0").value = userdataObj.texture;
        }
        if(userdataObj.texture2){
            document.getElementById("texture02").value = userdataObj.texture2;
        }
        if(userdataObj.selectable != undefined){
            document.getElementById("selectable").value = userdataObj.selectable;
        }
        if(userdataObj.editable != undefined){
            document.getElementById("editable").value = userdataObj.editable;
        }
    }
    editablesel();
}

init();

/**
 * 可选择性change事件 
 */
function editablesel(){
    if(document.getElementById("selectable").value=="false"){
        document.getElementById("editable").selectedIndex=1;
        document.getElementById("editable").disabled=true;
    }
    else{
        document.getElementById("editable").disabled=false;
        // document.getElementById("editable").selectedIndex=0;
    }
}

/**
 * 添加材质
 */

function addLink(textId, hz) {

    var filePath = userdataObj.earth.UserDocument.OpenFileDialog(userdataObj.earth.RootPath, "所有支持类型|*.BMP;*.DIB;*.JPG;*.JPEG;*.PNG;*.TIF;*.TIFF;*.GIF|BMP文件(*.BMP;*.DIB)|*.BMP;*.DIB|JPEG文件(*.JPG;*.JPEG)|*.JPG;*.JPEG|PNG文件(*.PNG)|*.PNG");

    if (filePath == "")

        return;

    var fileType = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();

    if ("jpg" == fileType || "jpeg" == fileType || "png" == fileType || "bmp" == fileType || "gif" == fileType) {

        document.getElementById(textId).value = filePath;

    } else {

        alert("支持图片格式为:jpeg,jpg,png,bmp,gif");

    }
}

/**
 * 确定点击事件
 */
function submit() {
    var radius = $('#radius').val(),
        columHeight = $('#columHeight').val(),
        bannerHeight = $('#bannerHeight').val(),
        bannerWidth = $('#bannerWidth').val(),
        texture2 = $('#texture02').val(),
        texture = $('#texture0').val();
        name = $("#lineRingName").val();
    if (bannerWidth == '' || isNaN(bannerWidth) || bannerWidth <= 0) {
        alert('横幅宽度需为正数');
        return;
    }
    if (bannerHeight == '' || isNaN(bannerHeight) || bannerHeight <= 0) {
        alert('横幅高度需为正数');
        return;
    }
    if (columHeight == '' || isNaN(columHeight) || columHeight <= 0) {
        alert('圆柱高度需为正数');
        return;
    }
    if (radius == '' || isNaN(radius) || radius <= 0) {
        alert('圆柱半径需为正数');
        return;
    }
    if (texture == '') {
        alert('请选择纹理图片');
        return;
    }
    if (texture2 == '') {
        alert('请选择纹理图片');
        return;
    }
    if(!name){
        alert("请输入名称");
        return;
    }

    var selectable = document.getElementById("selectable").value;
    var editable = document.getElementById("editable").value;
    returnValue = {
        name: name,
        radius: Number(radius),
        columHeight: Number(columHeight),
        bannerHeight: Number(bannerHeight),
        bannerWidth: Number(bannerWidth),
        texture: texture,
        texture2: texture2,
        selectable: selectable,
        editable: editable
    };
    userdataObj.name = name;
    userdataObj.columradius = Number(radius);
    userdataObj.columHeight = Number(columHeight);
    userdataObj.bannerHeight = Number(bannerHeight);
    userdataObj.bannerWidth = Number(bannerWidth);
    userdataObj.texture = texture;
    userdataObj.texture2 = texture2;
    userdataObj.selectable = selectable;
    userdataObj.editable = editable;
    window.returnValue = returnValue;
    window.close();
}

function closeWindow() {
    window.close();
}
