/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：线缓冲
 * 注意事项：该文件方法仅为线缓冲使用
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
// 子窗口返回对象
function returnValue(){

    if(userdataObj != null) {
        userdataObj.click="true";
        var name=document.getElementById("lineRingName").value;
        userdataObj.name=name;

        var description = document.getElementById("description").value;
        userdataObj.desc=description;

        var LineWidth = document.getElementById("lineWidth").value;
        userdataObj.linewidth = LineWidth;

        var transparency = document.getElementById("transparency").value;
        transparency = parseInt(transparency).toString(16);
        userdataObj.transparency=transparency;

        userdataObj.Shadow=document.getElementById("shadow").value;
         var fillColor = document.getElementById("fillColor").value;
        fillColor = fillColor.substring(1);
        userdataObj.fillcolor = "#" + transparency + fillColor;

        //线透明度
        var lineTransparency = document.getElementById("lineTransparency").value;
        lineTransparency = parseInt(lineTransparency).toString(16);
        userdataObj.lineTransparency = lineTransparency;

        //线颜色
        var lineColor = document.getElementById("lineColor").value;
        lineColor = lineColor.substr(1);
        userdataObj.linecolor = "#" + lineTransparency + lineColor;

        //新增属性
        var drawOrder = document.getElementById("drawOrder").value;
        userdataObj.drawOrder = drawOrder;

        //可选择性
        var selectable = document.getElementById("selectable").value;
        userdataObj.selectable = selectable;

        //可编辑性
        var editable = document.getElementById("editable").value;
        userdataObj.editable = editable;

        var drawOrder = document.getElementById("drawOrder").value;
        userdataObj.drawOrder = drawOrder;
    }
    return userdataObj;
}
// 给输入值设置范围
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
    var lineTransparency = document.getElementById("lineTransparency").value;
    if(""==lineTransparency) {
        alert("透明度不能为空!");
        document.getElementById("lineTransparency").focus();
        return false;
    }
    if (isNaN(lineTransparency)) {
        alert("透明度必须是数字！");
        document.getElementById("lineTransparency").focus();
        return false;
    }
    if(parseInt(lineTransparency) < 0 || parseInt(lineTransparency) > 255){
        alert("透明度超出范围！");
        document.getElementById("lineTransparency").focus();
        return false;
    }
    var lineWidth = document.getElementById("lineWidth").value;
    if ("" == lineWidth) {
        alert("请输入线宽！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    if (isNaN(lineWidth)) {
        alert("线宽输入不正确！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    if (lineWidth<=0) {
        alert("线宽输入不正确！");
        document.getElementById("lineWidth").focus();
        return false;
    }
	if(document.getElementById('drawOrderRow').style.display != 'none'){
		var drawOrder = document.getElementById("drawOrder").value;
		if(""!=drawOrder){
			if (isNaN(drawOrder)) {
				alert("渲染顺序输入不正确！");
				document.getElementById("drawOrder").focus();
				return false;
			}
			if (drawOrder<0) {
				alert("渲染顺序输入不正确！");
				document.getElementById("drawOrder").focus();
				return false;
			}
		}
	}
    return true;
}

function checkTagDisplay(){
    //标签可见性控制
    if (Number(userdataObj.type) === 257 || Number(userdataObj.type) === 258 || Number(userdataObj.type) === 259) {
        document.getElementById('drawOrderRow').style.display = 'none';
        document.getElementById('selectableRow').style.display = 'none';
        document.getElementById('editableRow').style.display = 'none';
        document.getElementById("shadowType").style.display = "none";
    } else {
        document.getElementById('drawOrderRow').style.display = '';
        document.getElementById('selectableRow').style.display = '';
        document.getElementById('editableRow').style.display = '';
        if(userdataObj.selectable != undefined){
            document.getElementById("selectable").value = userdataObj.selectable;
        }
        if(userdataObj.editable != undefined){
            document.getElementById("editable").value = userdataObj.editable;
        }
    }
}
// 获取用户创建对象属性
function attributeUserdata(){

    checkTagDisplay();

    document.getElementById("lineRingName").value = userdataObj.name;
    if("add" == userdataObj.action){
        return;
    }else if("edit" == userdataObj.action){
        var nodeObj = null;
        var lineRingName = userdataObj.name;
        document.getElementById("lineRingName").value = lineRingName;

        var lineColor = userdataObj.linecolor;
        var lineColorLen = lineColor.length;
        if(lineColorLen === 3){// ""#0000ff" #ff" 蓝色 前两位都为0
            var colorStr = lineColor.substring(1);
            document.getElementById("lineColor").value = "#" + "0000" +colorStr;
            document.getElementById("lineTransparency").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "0000" +colorStr;
        } else if(lineColorLen === 5){
            var colorStr = lineColor.substring(1);
            document.getElementById("lineColor").value = "#" + "00" +colorStr;
            document.getElementById("lineTransparency").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "00" +colorStr;
        } else if(lineColorLen === 7) { // "#ff0000"
            document.getElementById("lineColor").value = lineColor;
            document.getElementById("lineTransparency").value =  0;
            document.getElementById("lineColorSel").style.background = lineColor;
        } else if(lineColorLen === 8) { // "#aff0000"
            var colorStr = lineColor.substring(2);
            var HEX = lineColor.substr(1, 1);
            document.getElementById("lineColor").value = "#" +colorStr;
            document.getElementById("lineTransparency").value =  parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        } else if(lineColorLen === 9) {
            var colorStr = lineColor.substring(3);
            document.getElementById("lineColor").value = "#" + colorStr;
            var HEX = lineColor.substr(1, 2);
            document.getElementById("lineTransparency").value =  parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        }

        var lineWidth = userdataObj.linewidth;
        document.getElementById("lineWidth").value = lineWidth;

        var description = userdataObj.desc;
        //var description = userdataObj.desc;
        document.getElementById("description").value = description;

        //面颜色
        var fillColor;
        var transparency;
        if(userdataObj.type != 220){//不是线条
            fillColor = userdataObj.fillcolor;
            var fillColorLen = fillColor.length;
            if(fillColorLen === 3){// ""#0000ff" #ff" 蓝色 前两位都为0
                var colorStr = fillColor.substring(1);
                document.getElementById("fillColor").value = "#" + "0000" +colorStr;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = "#" + "0000" +colorStr;
            } else if(fillColorLen === 5){
                var colorStr = fillColor.substring(1);
                document.getElementById("fillColor").value = "#" + "00" +colorStr;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = "#" + "00" +colorStr;
            } else if(fillColorLen === 7) { // "#ff0000"
                document.getElementById("fillColor").value = fillColor;
                document.getElementById("transparency").value =  0;
                document.getElementById("fillColorSel").style.background = fillColor;
            } else if(fillColorLen === 8) { // "#aff0000"
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
    document.getElementById("shadow").value = userdataObj.Shadow;
    document.getElementById("drawOrder").value = userdataObj.drawOrder;
    editablesel();
}

// 取消按钮
function closeWindow(){
    isSubmit = false;
    userdataObj.click="false";
    window.close();
}
// 离开当前窗口时
function unloadMilitaryWindow(){
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
function containSpecial( s ){
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}