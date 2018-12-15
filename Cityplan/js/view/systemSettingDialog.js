/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月26日
 * 描    述：系统设置页面脚本
 * 注意事项：依赖jquery.js
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */
var earth = null;
$(function() {
    var params = window.dialogArguments;
    earth = params.earth;

    //初始化工程列表
    function initProjectList() {
        var pipeProjectList = [];
        var rootLayerList = earth.LayerManager.LayerList;
        var projectCount = rootLayerList.GetChildCount();
        for (var i = 0; i < projectCount; i++) {
            var childLayer = rootLayerList.GetChildAt(i);
            var layerType = childLayer.LayerType;
            if (layerType === "Project") { //17
                var projectId = childLayer.Guid;
                var projectName = childLayer.Name;

                var chlildrenCount = childLayer.GetChildCount();
                var pipeTag = false;

                for (var x = 0; x < chlildrenCount; x++) {
                    var pipechildLayer = childLayer.GetChildAt(x);
                    var pipelayerType = pipechildLayer.LayerType;
                    pipeTag = true;
                    if (pipelayerType === "Folder") {
                        var threeLayerCount = pipechildLayer.GetChildCount();
                        for (var s = 0; s < threeLayerCount; s++) {
                            var threechildLayer = pipechildLayer.GetChildAt(s);
                            var threepipelayerType = threechildLayer.LayerType;
                            pipeTag = true;
                        }
                    }
                }
                if (projectName == "globe") {
                    pipeTag = false;
                }
                if (pipeTag) {
                    pipeProjectList.push({
                        id: projectId,
                        name: projectName
                    });
                }
            }
        }
        return pipeProjectList;
    }

    /**
     * 功能：初始化文本框值域
     * 参数：无
     * 返回值：无
     */
    function initList() {
        var layer = earth.LayerManager.LayerList;
        var projectList = initProjectList();
        if (projectList != null) {
            var count = projectList.length;
            for (var i = 0; i < count; i++) {
                var project = projectList[i];
                var option = '<option value="' + project.id + '">' + project.name + '</option>';
                $("#projectList").append(option);
            }
        }
        $("#projectList").val(params.project);
        $("#viewPoint").val(params.Position);
        $("#profileAlt").val(parseInt(params.profileAlt) == 0?0:1);
    }

    //【确定】按钮onclick事件
    $("#confirmBtn").click(function() {
        params.project = $("#projectList").val();
        params.prePrjGuid = params.currentPrjGuid;
        params.balloonAlpha = $('#chkBalnAlpha')[0].checked ? 0xcc : -1;
        params.profileAlt = $("#profileAlt").val();
        params.Position = $("#viewPoint").val();
        window.returnValue = params;
        window.close();
    });

    //获取当前视角
    $("#setViewPoint").click(function(){
        var obj = {};
        obj.longitude=earth.GlobeObserver.TargetPose.Longitude;
        obj.latitude=earth.GlobeObserver.TargetPose.Latitude;
        obj.altitude=earth.GlobeObserver.TargetPose.Altitude;
        obj.tilt=earth.GlobeObserver.Pose.Tilt;
        obj.heading=earth.GlobeObserver.Pose.Heading;
        obj.roll=earth.GlobeObserver.Pose.Roll;
        obj.range=earth.GlobeObserver.Pose.Range;
        var viewPoint = obj.longitude+","+obj.latitude+","+obj.altitude+","+obj.tilt+","+obj.heading+","+obj.roll+","+obj.range;
        $("#viewPoint").val(viewPoint);
    });

    //取消
    $("#cancleBtn").click(function () {
        window.close();
    });

    initList(); //初始化文本框

    if(isNaN(params.balloonAlpha) || params.balloonAlpha >= 0){//气泡透明
        $('#chkBalnAlpha')[0].checked = true;
    }else{
        $('#chkBalnAlpha')[0].checked = false;
    }
});