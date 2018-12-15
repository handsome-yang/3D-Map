/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月26日
 * 描    述：飞行路径的添加路径名称页面
 * 注意事项：依赖jquery.js
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var param = window.dialogArguments;//外部传入参数
var originName = window.location.search.split("=")[1];//原名

/**
 * 名称内容检查
 * @return {[type]} [description]
 */
function check(){
    if(trackName.value == ""){
        alert("名称不能为空！");
        trackName.focus();
        return false;
    }
    if(containSpecial(trackName.value)){
        alert("名称不能有特殊字符！");
        trackName.focus();
        return false;
    }
    if(trackName.length > 20){
        alert("名称过长！");
        return false;
    }
    if(param){
        if(originName){
            if(param.length == 1){
                return true;
            }else{
                for(var i=0; i<param.length; i++){
                    if(trackName.value == param[i].NAME && originName!= param[i].NAME){
                        alert("名称不能重复！");
                        trackName.focus();
                        return false;
                    }
                }
            }
        }else{
            if(param.length > 0){
                for(var i=0; i<param.length; i++){
                    if(trackName.value == param[i].NAME){
                        alert("名称不能重复！");
                        trackName.focus();
                        return false;
                    }
                }
            }else{
                if(trackName.value == param.NAME){
                    alert("名称不能重复！");
                    trackName.focus();
                    return false;
                }
            }

        }
    }
    return true;
}

/**
 * 特殊字符检查
 * @param  {[type]} s [description]
 * @return {[type]}   [description]
 */
function containSpecial( s ){
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}

/**
 * 设置路径名
 */
function setTrackName(){
    if(check()){
        window.returnValue = trackName.value;
        window.close();
    }
}

/**
 * 初始化
 * @return {[type]} [description]
 */
function init(){
    if(originName){
        trackName.value = originName;
    }else if(param && param.name){
        trackName.value = param.name;
    }
}

//窗口加载事件
window.onload = init;

//确定
$("#btnAdd").click(function () {
    setTrackName();
});

//取消
$("#btnCancel").click(function () {
    window.close();
});


