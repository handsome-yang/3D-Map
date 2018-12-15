/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：地块指标
 * 注意事项：该文件方法仅为地块指标使用
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var params = "";
var earth = "";
var projManager ="";
function getEarth(earthObj){
    earth = earthObj;
    params = earth.param;
    projManager =earth.projManager;
    var selectedNodeId=params.nodeId;
    if(selectedNodeId){
        var planData=projManager.getPlanById(selectedNodeId);
        if(planData.length==1){
            $("#XMMC").text(planData[0]["CPPLAN.NAME"]||"");//方案名称
            $("#AJBH").text(planData[0]["CPPLAN.AJBH"]||"");//案卷编号
            $("#GHYDMJ").text(planData[0]["CPPLAN.GHZYD"]||"");//规划用地面积
            $("#GHJYDMJ").text(planData[0]["CPPLAN.GHJYD"]||"");//规划净用地面积
            $("#DZDLMJ").text(planData[0]["CPPLAN.DLYD"]||"");//代征道路面积
            $("#DZLDMJ").text(planData[0]["CPPLAN.GGLD"]||"");//代征绿地面积
            $("#JZJDMJ").text(planData[0]["CPPLAN.ZJZMJ"]||"");//建筑基底面积
            $("#LDMJ").text(planData[0]["CPPLAN.GGLD"]||"");//绿地面积
            $("#YEYYDMJ").text(planData[0]["CPPLAN.YEYJZMJ"]||"");//幼儿园用地面积
            $("#YEYHDCDMJ").text(planData[0]["CPPLAN.DSJZMJ"]||"");//幼儿园活动场地面积
            $("#TYJSSSYDMJ").text(planData[0]["CPPLAN.TYJSSSYDMJ"]||"");//体育健身设施用地面积
            $("#YLSSYDMJ").text(planData[0]["CPPLAN.SQFWZXJZMJ"]||"");//养老设施用地面积
            $("#ZJZMJ").text(planData[0]["CPPLAN.ZJZMJ"]||"");//总建筑面积
            $("#ZZ").text(planData[0]["CPPLAN.ZZJZMJ"]||"");//住宅
            $("#SYMM").text(planData[0]["CPPLAN.SYJZMJ"]||"");//商业门面
            $("#JZSY").text(planData[0]["CPPLAN.JZSY"]||"");//集中商业
            $("#BG").text(planData[0]["CPPLAN.BG"]||"");//办公
            $("#BGBZ").text(planData[0]["CPPLAN.BGBZ"]||"");//办公备注
            $("#XX").text(planData[0]["CPPLAN.YEYJZMJ"]||"");//学校
            $("#XXBZ").text(planData[0]["CPPLAN.XXBZ"]||"");//学校备注
            $("#YY").text(planData[0]["CPPLAN.YY"]||"");//医院
            $("#YYBZ").text(planData[0]["CPPLAN.YYBZ"]||"");//医院备注
            $("#YEY").text(planData[0]["CPPLAN.YEYJZMJ"]||"");//幼儿园
            $("#YEYBZ").text(planData[0]["CPPLAN.YEYBZ"]||"");//幼儿园备注
            $("#SHGGFWSS").text(planData[0]["CPPLAN.SQFWZXJZMJ"]||"");//社会公共服务设施
            $("#SHGGFWSSBZ").text(planData[0]["CPPLAN.SHGGFWSSBZ"]||"");//社会公共服务设施备注
            $("#TYJSSS").text(planData[0]["CPPLAN.TYJSSS"]||"");//体育健身设施
            $("#TYJSSSBZ").text(planData[0]["CPPLAN.TYJSSSBZ"]||"");//体育健身设施备注
            $("#YLSS").text(planData[0]["CPPLAN.YLSS"]||"");//养老设施
            $("#YLSSBZ").text(planData[0]["CPPLAN.YLSSBZ"]||"");//养老设施备注
            $("#CF").text(planData[0]["CPPLAN.CF"]||"");//厂房
            $("#CFBZ").text(planData[0]["CPPLAN.CFBZ"]||"");//厂房备注
            $("#CC").text(planData[0]["CPPLAN.CC"]||"");//仓储
            $("#CCBZ").text(planData[0]["CPPLAN.CCBZ"]||"");//仓储备注
            $("#SBYF").text(planData[0]["CPPLAN.SBYF"]||"");//设备用房
            $("#SBYFBZ").text(planData[0]["CPPLAN.SBYFBZ"]||"");//设备用房备注
            $("#CK").text(planData[0]["CPPLAN.CK"]||"");//车库
            $("#CKBZ").text(planData[0]["CPPLAN.CKBZ"]||"");//车库备注
            $("#JRDSQT").text(planData[0]["CPPLAN.JRDSQT"]||"");//计容地上其他
            $("#JRDSQTBZ").text(planData[0]["CPPLAN.JRDSQTBZ"]||"");//计容地上其他备注
            $("#DSMJHJ").text(planData[0]["CPPLAN.DSJZMJ"]||"");//地上面积合计
            $("#DSMJHJBZ").text(planData[0]["CPPLAN.DSMJHJBZ"]||"");//地上面积合计备注
            $("#DXSY").text(planData[0]["CPPLAN.DXSYMJ"]||"");//地下商业
            $("#DXSYBZ").text(planData[0]["CPPLAN.DXSYBZ"]||"");//地下商业备注
            $("#QTJYXYF").text(planData[0]["CPPLAN.DXTCCMJ"]||"");//其他经营性用房
            $("#QTJYXYFBZ").text(planData[0]["CPPLAN.DXQTMJBZ"]||"");//其他经营性用房备注
            $("#DXMJHJ").text(planData[0]["CPPLAN.DXJZMJ"]||"");//地下面积合计
            $("#DXMJHJBZ").text(planData[0]["CPPLAN.DXMJHJBZ"]||"");//地下面积合计备注
            $("#JRJZMJZHJ").text(planData[0]["CPPLAN.JRJZMJZHJ"]||"");//计容建筑面积总合计
            $("#JKGGHD").text(planData[0]["CPPLAN.JKGGHD"]||"");//架空公共活动
            $("#JKGGHDBZ").text(planData[0]["CPPLAN.JKGGHDBZ"]||"");//架空公共活动备注
            $("#JKGGTC").text(planData[0]["CPPLAN.JKGGTC"]||"");//架空公共停车
            $("#JKGGTCBZ").text(planData[0]["CPPLAN.JKGGTCBZ"]||"");//架空公共停车备注
            $("#JKLH").text(planData[0]["CPPLAN.JKLH"]||"");//架空绿化
            $("#JKLHBZ").text(planData[0]["CPPLAN.JKLHBZ"]||"");//架空绿化备注
            $("#BJRDSQT").text(planData[0]["CPPLAN.BJRDSQT"]||"");//不计容地上其他
            $("#BJRDSQTBZ").text(planData[0]["CPPLAN.BJRDSQTBZ"]||"");//不计容地上其他备注
            $("#DXTC").text(planData[0]["CPPLAN.DXTC"]||"");//地下停车
            $("#DXTCBZ").text(planData[0]["CPPLAN.DXTCBZ"]||"");//地下停车备注
            $("#BJRSBYF").text(planData[0]["CPPLAN.BJRSBYF"]||"");//不计容设备用房
            $("#BJRSBYFBZ").text(planData[0]["CPPLAN.BJRSBYFBZ"]||"");//不计容设备用房备注
            $("#GGFWSS").text(planData[0]["CPPLAN.GGFWSS"]||"");//公共服务设施
            $("#GGFWSSBZ").text(planData[0]["CPPLAN.GGFWSSBZ"]||"");//公共服务设施备注
            $("#BJRDXQT").text(planData[0]["CPPLAN.BJRDXQT"]||"");//不计容地下其他
            $("#BJRDXQTBZ").text(planData[0]["CPPLAN.BJRDXQTBZ"]||"");//不计容地下其他备注
            $("#BJRJZMJZHJ").text(planData[0]["CPPLAN.BJRJZMJZHJ"]||"");//不计容建筑面积总合计
            $("#JZMD").text(planData[0]["CPPLAN.JZMD"]||"");//建筑密度
            $("#RJL").text(planData[0]["CPPLAN.RJL"]||"");//容积率
            $("#LDL").text(planData[0]["CPPLAN.LDL"]||"");//绿地率
            $("#DMJDCTCW").text(planData[0]["CPPLAN.DSTCW"]||"");//地面机动车停车位
            $("#DSLTJXTCW").text(planData[0]["CPPLAN.DSLTJXTCW"]||"");//地上立体机械停车位
            $("#DXJDCTCW").text(planData[0]["CPPLAN.DXTCW"]||"");//地下机动车停车位
            $("#JDCTCWHJ").text(planData[0]["CPPLAN.ZTCW"]||"");//机动车停车位合计
            $("#DSFJDCTCW").text(planData[0]["CPPLAN.DSFJDCTCW"]||"");//地上非机动车停车位
            $("#DXFJDCTCW").text(planData[0]["CPPLAN.DXFJDCTCW"]||"");//地下非机动车停车位
            $("#FJDCTCWHJ").text(planData[0]["CPPLAN.FJDCTCWHJ"]||"");//非机动车停车位合计
            $("#JZZRS").text(planData[0]["CPPLAN.GHRS"]||"");//居住总人数
            $("#MORETHAN").text(planData[0]["CPPLAN.MORETHAN"]||"");//大于144m²户数
            $("#BETWEEN").text(planData[0]["CPPLAN.BETWEEN"]||"");//大于90m²,不大于144m²户数
            $("#LESSTHAN").text(planData[0]["CPPLAN.LESSTHAN"]||"");//不大于90m²户数
            $("#HSHJ").text(planData[0]["CPPLAN.GHHS"]||"");//户数合计
        }
    }else{
        alert("请选中方案树中的一个节点")
        return;
    }
};