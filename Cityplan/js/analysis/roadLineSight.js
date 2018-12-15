/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：沿路通视
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
function getEarth(earthObj){
    var analysis = earthObj.analysisObj;
    var btn = [
        $("#btnStart"),
        $("#endHeight"),
        $("#startHeight"),
        $("#showHeight"),
        $("#clear"),
        $("#step")
    ];

    $("#btnStart").click(function(){
        if($("#startHeight").val()==""||$("#endHeight").val()==""){
            alert("高度不能为空");
            return false;
        }
        if(isNaN($("#startHeight").val())){
            alert("请输入数字");
            return false;
        }
        if($("#startHeight").val()>100){
            alert("起点高度和目标高度不能超过100米");
            return false;
        }
        if($("#startHeight").val()<= 0){
            alert("起点高度和目标高度不能小于或等于0");
            return false;
        }

        if(isNaN($("#endHeight").val())){
            alert("请输入数字");
            return false;
        }

        if($("#endHeight").val()>100){
            alert("起点高度和目标高度不能超过100米");
            return false;
        }
        if($("#endHeight").val()<= 0){
            alert("起点高度和目标高度不能小于或等于0");
            return false;
        }
        if(check()){
            if($("#btnStart").text()==="开始分析"){
                $("#btnStart").attr("disabled","disabled") ;
                $("#step").attr("disabled","disabled") ;
                $("#btnPoint").attr("disabled","disabled") ;
                $("#btnLine").attr("disabled","disabled") ;
                $("#endHeight").attr("disabled","disabled") ;
                $("#startHeight").attr("disabled","disabled") ;
                $("#showHeight").attr("disabled","disabled") ;
                $("#clear").attr("disabled","disabled") ;
                analysis.mRoadLineSight(startHeight.value,endHeight.value,space.value,btn);
            }
        }
    });

    $("#clear").click(function(){
        analysis.clearHtmlBallon(earthObj.htmlBallon);
    });

    $("#showHeight").click(function(){
        if($("#startHeight").val()==""||$("#endHeight").val()==""){
            alert("高度不能为空");
            return false;
        }
        if(isNaN($("#startHeight").val())){
            alert("请输入数字");
            return false;
        }

        if($("#startHeight").val()>100){
            alert("起点高度和目标高度不能超过100米");
            return false;
        }

        if(isNaN($("#endHeight").val())){
            alert("请输入数字");
            return false;
        }

        if($("#endHeight").val()>100){
            alert("起点高度和目标高度不能超过100米");
            return false;
        }
        analysis.showHeightLine();
    });

    window.onunload=function(){
        analysis.clear();
        analysis.clearMenuStyle();
    };
}

function check(){
    if(isNaN($("#startHeight").val()) == true){
        alert("无效的起点高度");
        startHeight.select();
        startHeight.focus();
        return false;
    }
    if(isNaN($("#endHeight").val()) == true){
        alert("无效的目标高度");
        endHeight.select();
        endHeight.focus();
        return false;
    }
    if(isNaN($("#step").val()) == true){
        alert("无效的分析步长");
        endHeight.select();
        endHeight.focus();
        return false;
    }
    return true;
}