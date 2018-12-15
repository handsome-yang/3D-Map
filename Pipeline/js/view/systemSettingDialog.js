/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：系统设置js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
$(function () {
    var params = window.dialogArguments;
    earth = params.earth;
    /**
     * 功能：初始化文本框值域
     * 参数：无
     * 返回值：无
     */
    function initList() {
        var layer = earth.LayerManager.LayerList;
        var projectList = params.projectList;
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
        $("#profileAlt").val(parseInt(params.profileAlt) == 0 ? 0 : 1);
        if (params.balloonAlpha > 0) {
            $('#chkBalnAlpha')[0].checked = true;
        } else {
            $('#chkBalnAlpha')[0].checked = false;
        }
    }

    initList(); //初始化文本框
    $("#projectList").change(function () {
        var layerId = $("#projectList").val();
        if (!layerId) {
            return;
        }
        var ProLayer = earth.LayerManager.GetLayerByGUID(layerId);
        var alt = 0;
        if (ProLayer) {
            alt = ProLayer.ProjectSetting.UnderRefAlt;
        }
        $("#alt").val(alt);
    });
    $("#projectList").trigger("change");

    /**
     * 功能：获取当前视角
     * 参数：无
     * 返回值：无
     */
    $("#setViewPoint").click(function () {
        var obj = {};
        obj.longitude = earth.GlobeObserver.TargetPose.Longitude;
        obj.latitude = earth.GlobeObserver.TargetPose.Latitude;
        obj.altitude = earth.GlobeObserver.TargetPose.Altitude;
        obj.tilt = earth.GlobeObserver.Pose.Tilt;
        obj.heading = earth.GlobeObserver.Pose.Heading;
        obj.roll = earth.GlobeObserver.Pose.Roll;
        obj.range = earth.GlobeObserver.Pose.Range;
        var viewPoint = obj.longitude + "," + obj.latitude + "," + obj.altitude + "," + obj.tilt + "," + obj.heading + "," + obj.roll + "," + obj.range;
        $("#viewPoint").val(viewPoint);
    });
    /**
     * 功能：【确定】按钮onclick事件
     * 参数：无
     * 返回值：无
     */
    $("#confirmBtn").click(function () {
        params.profileAlt = $("#profileAlt").val();
        params.project = $("#projectList").val();
        params.Alt = $("#alt").val();
        params.Position = $("#viewPoint").val();
        params.balloonAlpha = $('#chkBalnAlpha')[0].checked ? 1 : 0;
        window.returnValue = params;
        window.close();
    });
});