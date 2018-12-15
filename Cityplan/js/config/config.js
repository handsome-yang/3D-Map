/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月7日
 * 描    述：规划配置文件
 * 注意事项：只用于存放配置信息，其他内容勿存放
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 */

//方案配置映射
var CODEMAP = {
    Status: {
        1: '审批',
        2: '待审批',
        3: '已审批'
    },
    Stage: { //暂时只用到了方案，其他未用到，后面扩展时再使用
        1: '策划阶段',
        2: '设计阶段',
        3: '详规阶段',
        4: '方案' //'单体阶段'
    }
};

var STAMP_config = {}; //STAMP_config全局对象

//服务器配置
STAMP_config.server = {
    ip: "http://192.168.100.251", // 基础数据服务器地址
    screen: 0, // 基础数据配置文件索引
    dataServerIP: "http://192.168.100.251", // 编辑平台数据库服务IP
    serviceIP: "http://192.168.100.251", // 规划服务的IP地址
    username: "",//权限用户名
    password: "",//权限密码
    token: ""//权限秘钥
};

//顶部标题栏配置
STAMP_config.topInfo = {
    logo: "images/top/logo.png", //logo图片
    titleImg: "images/top/title.png", //系统标题图片--有图片时，文字无用，无图片时显示文字
    titleText: "三维城市规划系统" //系统标题文字
}

//规划服务配置（se_city_plan）
STAMP_config.service = {
    add: STAMP_config.server.serviceIP + "/se_city_plan?type=add", //添加
    update: STAMP_config.server.serviceIP + "/se_city_plan?type=update", //更新
    query: STAMP_config.server.serviceIP + "/se_city_plan?type=query", //查询
    remove: STAMP_config.server.serviceIP + "/se_city_plan?type=delete", //删除
    count: STAMP_config.server.serviceIP + "/se_city_plan?type=count", //计数-暂时未用到，后期扩展使用
    addAttachmentObj: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=add&tablename=CPATTACHMENT&filed=OBJ&id=", //附件增加
    getAttachmentObj: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=get&tablename=CPATTACHMENT&filed=OBJ&id=", //附件获取
    addBuildTopTexture: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=add&tablename=CPSIMPLEBUILD&filed=TOPTEXTURE&id=", //顶部纹理增加
    addBuildBottomTexture: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=add&tablename=CPSIMPLEBUILD&filed=BOTTOMTEXTURE&id=", //底部纹理增加
    addBuildBodyTexture: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=add&tablename=CPSIMPLEBUILD&filed=BODYTEXTURE&id=", //侧壁纹理增加
    getBuildTopTexture: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=get&tablename=CPSIMPLEBUILD&filed=TOPTEXTURE&id=", //顶部纹理获取
    getBuildBottomTexture: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=get&tablename=CPSIMPLEBUILD&filed=BOTTOMTEXTURE&id=", //底部纹理获取
    getBuildBodyTexture: STAMP_config.server.serviceIP + "/se_city_plan?type=blob&operation=get&tablename=CPSIMPLEBUILD&filed=BODYTEXTURE&id=" //侧壁纹理获取
};

//VE制作的方案内部数据信息
STAMP_config.constant = {
    SpatialRefFileName: "空间参考.spatial", // 空间参考文件名
    BuildingAttributeFileName: "建筑属性.xml", // 建筑属性XML文件名
    BuildingModelFolderName: "建筑模型", // 建筑模型文件夹名称
    GroundModelFolderName: "地面模型", // 地面模型文件夹名称
    AttachmentInfoFileName: "附件信息.xml" // 方案附件信息XML文件名
};

//各功能中保存在root文件夹下的用户数据路径
STAMP_config.constants = {
    TRACKFILE: "\\track\\trackList", // 飞行路线
    ANIMFILE: "\\visit\\visit", // 动画
    VIEWPOINTFILE: '\\viewpoint\\viewpoint', // 视点
    USERDATA: '\\userdata\\' // 用户数据
};

/*---------------------------------管线相关配置START---------------------------------------*/
//查询返回类型
var localSearchDataType = {
    xml: 1,
    xmlWithMesh: 4,
    jsonWithMesh: 6
};

//管线查询和分析后，双击定位显示的详细信息字段列表
STAMP_config.LineProperty = {
    DLLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_PRESSUR", //压力
        "US_VENTNUM", //电缆条数
        "US_HOLETOL", //总孔数
        "US_HOLEUSE", //已用孔数
        "US_PSVALUE", //电压值
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    DXLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_VENTNUM", //电缆条数
        "US_HOLETOL", //总孔数
        "US_HOLEUSE", //已用孔数
        "US_PSVALUE", //电压值
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    JSLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    PSLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_FLOWDIR", //流向
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    RQLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_PRESSUR", //压力
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    RLLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_PRESSUR", //压力
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    GYLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_PRESSUR", //压力
        "US_FLOWDIR", //流向
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ],
    DEFAULTLINE: [
        "US_KEY", //编号
        "US_LTTYPE", //埋设方式
        "US_PMATER", //材质
        "US_SIZE", //管径
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_STATUS" //更新状态
    ]
};

STAMP_config.PointProperty = {
    WELLPOINT: [
        "US_KEY", //编号
        "X", //X坐标
        "Y", //Y坐标
        "US_PT_ALT", //地面高程
        "US_PT_TYPE", //特征
        "US_ATTACHMENT", //附属物
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_UPDATE", //更新状态
        "US_WELL", //井类型
        "US_WDIA", //井直径
        "US_NDEEP", //井脖深
        "US_WDEEP", //井底深
        "US_PLATE", //井盖类型
        "US_PSIZE", //井盖规格
        "US_PMATER", //井盖材质
        "US_WMATER", //井材质
        "US_ANGLE", //旋转角度
        "US_OFFSET" //偏心井点号
    ],
    DEFAULTPOINT: [
        "US_KEY", //编号
        "X", //X坐标
        "Y", //Y坐标
        "US_PT_ALT", //地面高程
        "US_PT_TYPE", //特征
        "US_ATTACHMENT", //附属物
        "US_ROAD", //所在道路
        "US_OWNER", //权属单位
        "US_BD_TIME", //建设年代
        "US_UPDATE" //更新状态
    ]
};

/*---------------------------------管线相关配置END---------------------------------------*/

//布局宽高设置
STAMP_config.height = {
    bannerHeight: 70, //标题栏高度
    toolHeight: 40, //二级菜单工具栏高度
    leftPanelWidth: 255 //左侧面板宽度
};