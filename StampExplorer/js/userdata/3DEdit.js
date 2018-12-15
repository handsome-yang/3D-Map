/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：三维对象
 * 注意事项：该文件方法仅为三维对象使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/

var userdataObj = window.dialogArguments;
var isSubmit = false;
function polygon_submit() {
    isSubmit = true;
    if(check()) {
        returnValue();
        window.close();
    }
}
/**
 * [returnValue 子窗口对象]
 * @return {[obj]} [userdataObj]
 */
function returnValue(){
    if(userdataObj != null) {
        userdataObj.click="true";
        var name=document.getElementById("lineRingName").value;
        userdataObj.name=name;

        var description = document.getElementById("description").value;
        userdataObj.desc=description;

        var textruePathArr=[];
        var textrue0=document.getElementById("texture0").value;
        var textrue1=document.getElementById("texture1").value;
        var textrue2=document.getElementById("texture2").value;
        var dataProcess=document.getElementById("dataProcess");

        //将图片格式转换成规定格式并保存到temp/picture下面

        dataProcess.Load();

        if(textrue0!=null&&textrue0!=""){
            var texttrue=textrue0.split("\\");
            var texttrueFname=texttrue[texttrue.length-1];
            var  rootpath= userdataObj.earth.RootPath+STAMP_config.constants.USERDATA+texttrueFname;
            var a=dataProcess.DataConvert.Convert_File(textrue0,rootpath);
            if(a===1){
                textrue0=  textrue0;
            }else if(a===0){
                textrue0=  rootpath;
            } else if(a===-1){
                alert("模型转换没成功！");
                return;
            }
            textrue0=  rootpath;
        }

        if(textrue1!=null&&textrue1!=""){
            var texttrue=textrue1.split("\\");
            var texttrueFname=texttrue[texttrue.length-1];
            var  rootpath= userdataObj.earth.RootPath+STAMP_config.constants.USERDATA+texttrueFname;
            var a=dataProcess.DataConvert.Convert_File(textrue1,rootpath)  ;
            if(a===1){
                textrue1=  textrue1;
            }else if(a===0){
                textrue1=  rootpath;
            } else if(a===-1){
                alert("模型转换没成功！");
                return;
            }
        }

        if(textrue2!=null&&textrue2!=""){

            var texttrue=textrue2.split("\\");
            var texttrueFname=texttrue[texttrue.length-1];
            var  rootpath= userdataObj.earth.RootPath+STAMP_config.constants.USERDATA+texttrueFname;
            var a=dataProcess.DataConvert.Convert_File(textrue2,rootpath)  ;

            if(a===1){
                textrue2=  textrue2;
            }else if(a===0){
                textrue2=  rootpath;
            } else if(a===-1){
                alert("模型转换没成功！");
                return;
            }

        }

        textruePathArr.push(textrue0);
        textruePathArr.push(textrue1);
        textruePathArr.push(textrue2);

        userdataObj.texturePath=textruePathArr;
        var transparency = document.getElementById("transparency").value;
        transparency = parseInt(transparency).toString(16);
        if(transparency.length == 1){
            transparency = "0" + transparency;
        }

        var fillColor = document.getElementById("fillColor").value;
        fillColor = fillColor.substring(1);
        userdataObj.fillcolor = "#" + transparency + fillColor;

        if(userdataObj.type === 216){
            userdataObj.radius = document.getElementById("radius").value;
        }

        userdataObj.selectable = document.getElementById("selectable").value;
        userdataObj.editable = document.getElementById("editable").value;
        userdataObj.objectFlagType = document.getElementById("underground").value;

        //新增属性
        userdataObj.longValue=document.getElementById("long").value;
        userdataObj.widthValue=document.getElementById("width").value;
        userdataObj.heightValue=document.getElementById("height").value;
        userdataObj.topRadius=document.getElementById("topRadius").value;
        userdataObj.bottomRadius=document.getElementById("bottomRadius").value;

        if(userdataObj.type === 205 || userdataObj.type === 206){
            userdataObj.sides = document.getElementById("sides").value;
        }
    }
    return userdataObj;
}
// 控制输入值范围
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
    if(userdataObj.type=="216"){
        var radius = document.getElementById("radius").value;
        if ("" == radius) {
            alert("请输入球半径！");
            document.getElementById("radius").focus();
            return false;
        }
        if (isNaN(radius)) {
            alert("球半径输入不正确！");
            document.getElementById("radius").focus();
            return false;
        }
    }
    if(userdataObj.type=="202"){
        var long = document.getElementById("long").value;
        if ("" == long) {
            alert("请输入长！");
            document.getElementById("long").focus();
            return false;
        }
        if (isNaN(long)) {
            alert("长输入不正确！");
            document.getElementById("long").focus();
            return false;
        }
        var width = document.getElementById("width").value;
        if ("" == width) {
            alert("请输入宽！");
            document.getElementById("width").focus();
            return false;
        }
        if (isNaN(width)) {
            alert("宽输入不正确！");
            document.getElementById("width").focus();
            return false;
        }
        var height = document.getElementById("height").value;
        if ("" == height) {
            alert("请输入高！");
            document.getElementById("height").focus();
            return false;
        }
        if (isNaN(height)) {
            alert("高输入不正确！");
            document.getElementById("height").focus();
            return false;
        }
    }
    if(userdataObj.type=="207"){
        var height = document.getElementById("height").value;
        if ("" == height) {
            alert("请输入高！");
            document.getElementById("height").focus();
            return false;
        }
        if (isNaN(height)) {
            alert("高输入不正确！");
            document.getElementById("height").focus();
            return false;
        }
    }
    if(userdataObj.type=="203"){
        var height = document.getElementById("height").value;
        if ("" == height) {
            alert("请输入高！");
            document.getElementById("height").focus();
            return false;
        }
        if (isNaN(height)) {
            alert("高输入不正确！");
            document.getElementById("height").focus();
            return false;
        }
        var bottomRadius = document.getElementById("bottomRadius").value;
        if ("" == bottomRadius) {
            alert("请输入底面半径！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        if (isNaN(bottomRadius)) {
            alert("底面半径输入不正确！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
    }
    if(userdataObj.type=="204"){
        var height = document.getElementById("height").value;
        if ("" == height) {
            alert("请输入高！");
            document.getElementById("height").focus();
            return false;
        }
        if (isNaN(height)) {
            alert("高输入不正确！");
            document.getElementById("height").focus();
            return false;
        }
        var bottomRadius = document.getElementById("bottomRadius").value;
        if ("" == bottomRadius) {
            alert("请输入底面半径！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        if (isNaN(bottomRadius)) {
            alert("底面半径输入不正确！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        var topRadius = document.getElementById("topRadius").value;
        if ("" == topRadius) {
            alert("请输入顶面半径！");
            document.getElementById("topRadius").focus();
            return false;
        }
        if (isNaN(topRadius)) {
            alert("顶面半径输入不正确！");
            document.getElementById("topRadius").focus();
            return false;
        }
    }
    if(userdataObj.type=="205"){
        var height = document.getElementById("height").value;
        if ("" == height) {
            alert("请输入高！");
            document.getElementById("height").focus();
            return false;
        }
        if (isNaN(height)) {
            alert("高输入不正确！");
            document.getElementById("height").focus();
            return false;
        }
        var bottomRadius = document.getElementById("bottomRadius").value;
        if ("" == bottomRadius) {
            alert("请输入底面半径！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        if (isNaN(bottomRadius)) {
            alert("底面半径输入不正确！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        var sides = document.getElementById("sides").value;
        if ("" == sides) {
            alert("请输入边数！");
            document.getElementById("sides").focus();
            return false;
        }
        var te= /^[1-9]+[0-9]*]*$/;
        if (!te.test(sides)) {
            alert("边数输入不正确！");
            document.getElementById("sides").focus();
            return false;
        }
        if (parseInt(sides)<3) {
            alert("边数输入不正确！");
            document.getElementById("sides").focus();
            return false;
        }
    }
    if(userdataObj.type=="206"){
        var height = document.getElementById("height").value;
        if ("" == height) {
            alert("请输入高！");
            document.getElementById("height").focus();
            return false;
        }
        if (isNaN(height)) {
            alert("高输入不正确！");
            document.getElementById("height").focus();
            return false;
        }
        var bottomRadius = document.getElementById("bottomRadius").value;
        if ("" == bottomRadius) {
            alert("请输入底面半径！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        if (isNaN(bottomRadius)) {
            alert("底面半径输入不正确！");
            document.getElementById("bottomRadius").focus();
            return false;
        }
        var sides = document.getElementById("sides").value;
        if ("" == sides) {
            alert("请输入边数！");
            document.getElementById("sides").focus();
            return false;
        }
        var te= /^[1-9]+[0-9]*]*$/;
        if (!te.test(sides)) {
            alert("边数输入不正确！");
            document.getElementById("sides").focus();
            return false;
        }
        if (parseInt(sides)<3) {
            alert("边数输入不正确！");
            document.getElementById("sides").focus();
            return false;
        }
        var topRadius = document.getElementById("topRadius").value;
        if ("" == topRadius) {
            alert("顶面半径！");
            document.getElementById("topRadius").focus();
            return false;
        }
        if (isNaN(topRadius)) {
            alert("顶面半径不正确！");
            document.getElementById("topRadius").focus();
            return false;
        }
    }
    return true;
}

function checkTagDisplay(){
    //标签可见性控制
    switch(Number(userdataObj.type))
    {
        case 216:
            document.getElementById('longPart').style.display = 'none';
            document.getElementById('widthPart').style.display = 'none';
            document.getElementById('heightPart').style.display = 'none';
            document.getElementById('bottomRadiusPart').style.display = 'none';
            document.getElementById('topRadiusPart').style.display = 'none';
            document.getElementById('sidesPart').style.display = 'none';
            document.getElementById('undertexttrue').style.display = 'none';
            document.getElementById('toptextture').style.display = 'none';
            break;
        case 202:
            document.getElementById('spherePart').style.display = 'none';
            document.getElementById('bottomRadiusPart').style.display = 'none';
            document.getElementById('topRadiusPart').style.display = 'none';
            document.getElementById('sidesPart').style.display = 'none';
            break;
        case 207:
            document.getElementById('spherePart').style.display = 'none';
            document.getElementById('longPart').style.display = 'none';
            document.getElementById('widthPart').style.display = 'none';
            document.getElementById('bottomRadiusPart').style.display = 'none';
            document.getElementById('topRadiusPart').style.display = 'none';
            document.getElementById('sidesPart').style.display = 'none';
            break;
        case 203://圆柱
            document.getElementById('spherePart').style.display = 'none';
            document.getElementById('longPart').style.display = 'none';
            document.getElementById('widthPart').style.display = 'none';
            document.getElementById('topRadiusPart').style.display = 'none';
            document.getElementById('sidesPart').style.display = 'none';
            break;
        case 204://圆台
            document.getElementById('spherePart').style.display = 'none';
            document.getElementById('longPart').style.display = 'none';
            document.getElementById('widthPart').style.display = 'none';
            document.getElementById('sidesPart').style.display = 'none';
            break;
        case 205://棱柱
            document.getElementById('spherePart').style.display = 'none';
            document.getElementById('longPart').style.display = 'none';
            document.getElementById('widthPart').style.display = 'none';
            document.getElementById('topRadiusPart').style.display = 'none';
            break;
        case 206://棱台
            document.getElementById('spherePart').style.display = 'none';
            document.getElementById('longPart').style.display = 'none';
            document.getElementById('widthPart').style.display = 'none';
            break;
        default:
            break;
    };
}

// 获取对象属性
function attributeUserdata(){
    checkTagDisplay();

    if(userdataObj.sides && (userdataObj.type === 205 || userdataObj.type === 206)){
        document.getElementById("sides").value = userdataObj.sides;
    }

    if (userdataObj.radius) {
        document.getElementById("radius").value = userdataObj.radius;
    };

    if(userdataObj.selectable!= undefined){
        document.getElementById("selectable").value = userdataObj.selectable.toString();
    }
    if(userdataObj.editable!= undefined){
        document.getElementById("editable").value = userdataObj.editable.toString();
    }

    if(userdataObj.objectFlagType != undefined){
        document.getElementById("underground").value = userdataObj.objectFlagType;
    }

    if(userdataObj.longValue){
        document.getElementById("long").value = userdataObj.longValue.toFixed(2);
    }
    if(userdataObj.widthValue){
        document.getElementById("width").value = userdataObj.widthValue.toFixed(2);
    }
    if(userdataObj.heightValue){
        document.getElementById("height").value = userdataObj.heightValue.toFixed(2);
    }
    if(userdataObj.bottomRadius){
        document.getElementById("bottomRadius").value = userdataObj.bottomRadius.toFixed(2);
    }
    if(userdataObj.topRadius){
        document.getElementById("topRadius").value = userdataObj.topRadius.toFixed(2);
    }

    document.getElementById("lineRingName").value = userdataObj.name;
    if(Number(userdataObj.type) === 216){
        document.getElementById("toptextture").style.display="none";
        document.getElementById("undertexttrue").style.display="none";
    }
    if("add" == userdataObj.action){
        return;
    }else if("edit" == userdataObj.action){
        var nodeObj = null;
        var lineRingName = userdataObj.name;
        document.getElementById("lineRingName").value = lineRingName;

        var description = userdataObj.desc;
        document.getElementById("description").value = description;
        var textruePathArr=userdataObj.texturePath;
        if(textruePathArr && textruePathArr.length){
            for(var i=0;i < textruePathArr.length; i++){
                document.getElementById("texture"+i).value = textruePathArr[i];
                if(Number(userdataObj.type) === 216){
                    document.getElementById("texture2").value = textruePathArr[2];
                }
            }
        }
        //面颜色
        var fillColor;
        var transparency;
        fillColor = userdataObj.FillColor;
        var fillColorLen = fillColor.length;
        if(fillColorLen === 3){
            var colorStr = fillColor.substring(1);
            document.getElementById("fillColor").value = "#" + "0000" +colorStr;
            document.getElementById("transparency").value = 0;
            document.getElementById("fillColorSel").style.background = "#" + "0000" +colorStr;
        }else if(fillColorLen === 5){
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
            document.getElementById("fillColorSel").style.background = "#" + colorStr;
        } else if(fillColorLen === 9) {
            var colorStr = fillColor.substring(3);
            document.getElementById("fillColor").value = "#" + colorStr;
            var HEX = fillColor.substr(1, 2);
            document.getElementById("transparency").value =  parseInt("0x" + HEX);
            document.getElementById("fillColorSel").style.background = "#" + colorStr;
        }
    }
    editablesel();
}

/**
 * 添加材质
 */

function addLink(textId,hz) {
    var filePath =  userdataObj.earth.UserDocument.OpenFileDialog(   userdataObj.earth.RootPath, "所有支持类型|*.BMP;*.DIB;*.JPG;*.JPEG;*.PNG;*.TIF;*.TIFF;*.GIF|BMP文件(*.BMP;*.DIB)|*.BMP;*.DIB|JPEG文件(*.JPG;*.JPEG)|*.JPG;*.JPEG|PNG文件(*.PNG)|*.PNG");
    if (filePath == ""){
        return;
    }
    var fileType = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();
    if ("jpg" == fileType || "jpeg" == fileType || "png" == fileType || "bmp" == fileType || "gif" == fileType) {
        document.getElementById(textId).value = filePath;
    } else {
        alert("支持图片格式为:jpeg,jpg,png,bmp,gif");
    }
}
// 退出
function closeWindow(){
    isSubmit = false;
    userdataObj.click="false";
    window.close();

}

function unload3DWindow(){
    if(!isSubmit){
        userdataObj.click="false";
    }
}
// 对象是否能被选中
function editablesel(){
    if(document.getElementById("selectable").value=="false"){
        document.getElementById("editable").selectedIndex=1;
        document.getElementById("editable").disabled=true;
    }
    else{
        document.getElementById("editable").disabled=false;
    }
}
// 过滤字符串
function containSpecial( s ){
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}
