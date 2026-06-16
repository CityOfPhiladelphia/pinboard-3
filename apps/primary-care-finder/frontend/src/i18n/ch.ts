export default {
  app: {
    title: '基本医疗机构查找器',
    subtitle: '费城的免费、低价医疗护理服务',
    noResults: '没有找到健康中心。 请检查您的拼写或删除一些筛选，并重试。',
  },
  introPage: {
    section1Title: '找到免费或低价的基本医疗机构',
    p0: 'HOME Healthcare项目确保您的基本医疗。 服务包括预防、保健和治疗常见疾病。',
    p05: '这些健康中心面向所有人。 您的移民情况和支付能力不会妨碍您获得所需的医疗服务。',
    p1: '找到在费城的基本医疗供应机构：',
    ol1: {
      li1: '通过您需要的服务进行筛选。',
      li2: '在地图上选择地点，以了解详细信息。',
      li3: '请在访问前联系医疗健康提供机构。',
    },
    section2Title: '保险和费用',
    p2: '这些健康中心接受多种形式的保险。 其中包括联邦医疗保险（Medicare）和联邦医疗补助（Medicaid）。 即使您没有医疗保险，也能获得医疗健康服务。 如果您没有医疗保险，您将需要根据自身收入和家庭人数的具体情况支付很少的费用。',
    section25Title: '需要帮助获得健康保险吗？',
    p25: "费城的BenePhilly计划提供免费支持，帮助居民申请健康保险。要了解更多信息，请访问 <a href='https://www.phila.gov/programs/benephilly/' target='_blank'>https://www.phila.gov/programs/benephilly</a>。",
    section3Title: '语言帮助',
    p3: '所有健康中心提供电话口译服务。 某些中心还提供现场口译。 查看每个地点的详细信息，以及工作人员使用的语言列表。 您还可搜索特定语言。',
    section4Title: '建立医患关系',
    p4: '您可能需要首先与医疗健康机构建立医患关系，然后才能享有一些服务。 拨打电话，安排新的患者预约，成为某一健康中心的患者。',
    section5Title: '查找器更新',
    p5: '我们每三个月为每个健康中心更新信息一次。 如果出现问题，您可以通过',
    feedbackForm: '反馈表联系我们',
  },
  cards: {
    table1Intro:
      '这些服务可能专门针对儿童或成人。 您可能需要首先成为医疗健康机构的患者，或与医疗健康机构建立医患关系，然后才能享有一些服务。',
    table2Intro:
      '其余的服务不按年龄划分。 有些服务向所有人开放，但是您需要首先与该健康中心建立医患关系，然后享有其他服务。',
  },
  service: '服务',
  slidingScale: '滑动费用范围',
  slidingScaleNull: '未提供滑动范围 拨打电话，了解更多信息。',
  ageSpecificServices: '儿科和成人医疗服务',
  otherServices: '更多服务',
  ageSpecificServicesEmpty: '本机构不提供其他仅针对儿童或成人的医疗服务',
  otherServicesEmpty: '不提供其他服务',
  ageRange: {
    category: '年龄段',
    adult: '成人',
    child: '儿童',
    adults: '成人',
    children: '儿童',
  },
  patientType: {
    category: '资格',
    patient_type_new: '新患者',
    patient_type_existing: '已建立医患关系的患者',
    patient_type_existing_only: '必须在现场建立医患关系',
  },
  visitType: {
    category: '基本医疗',
    well: '非病患就诊',
    sick: '病患就诊',
    sports: '体育体检',
    prenatal: '产前护理',
    women: '女性健康',
    telehealth: '远程医疗',
    vaccine: '接种疫苗',
  },
  tests: {
    category: '检测和医学影像服务',
    noTests:
      '本机构不提供筛选中列出的任何检测和医学影像服务。 拨打电话，就其他检测或医学影像服务进行咨询。',
    blood: '实验室和验血',
    sti: '性传染病检测',
    covid: '新冠检测',
    mammo: '乳腺X光检查',
    xray: 'X射线检查',
  },
  languages: {
    category: '工作人员使用的语言',
  },
  specialty: {
    category: '专科服务',
    mental: '精神健康',
    dental: '牙科',
    eye: '眼科',
    podiatry: '足科',
    mat: '药物辅助治疗',
    nutrition: '营养咨询',
    tobacco: '戒烟帮助',
    pharmacy: '机构隶属药房',
  },
  waitTime: {
    category: '等待时间（基本医疗）',
    walkIn: '当天或无预约（病患就诊）',
    oneWeekWell: '< 1个星期（非病患就诊）',
    oneWeekSick: '< 1个星期（病患就诊）',
    twoMonths: '< 2个月（所有基本医疗）',
  },
  transit: {
    bus: '公交车',
    subway: {
      label: '地铁',
      BSL: 'Broad Street Line（橙线）',
      MLF: 'Market-Frankford Line（蓝线）',
    },
    regRail: {
      label: '区域铁路',
      AL: 'Airport Line',
      CHE: 'Chestnut Hill East Line',
      CHW: 'Chestnut Hill West Line',
      CL: 'Cynwyd Line',
      FC: 'Fox Chase Line',
      GC: 'Glenside Combined',
      LD: 'Lansdale/Doylestown Line',
      PM: 'Center City到Penn Medicine Station',
      MN: 'Manayunk/Norristown Line',
      ME: 'Media/Elwyn Line',
      PT: 'Paoli/Thorndale Line',
      TL: 'Trenton Line',
      WL: 'Warminster Line',
      WTL: 'West Trenton Line',
      WN: 'Wilmington/Newark Line',
      FR: 'Fern Rock到Center City',
    },
    trolley: '手推车',
    car: {
      label: '汽车',
      OST: '提供路边停车位',
      MOST: '提供计量路边停车位',
      GP: '提供车库停车位',
      FG: '提供免费车库停车位',
      OS: '提供就地停车位',
      FOS: '提供免费就地停车位',
      RV: '需要确认',
      PL: '有街边停车场',
    },
  },
  tooltips: {
    well: '包括工作体检',
    mat: '针对阿片类药物成瘾的治疗药物',
    women: '包括计划生育和妇科护理',
  },
  warnings: {
    'This health center only offers HIV and STD/STI testing and treatment; walk-ins only ':
      '该健康中心仅提供艾滋病毒和性传播感染/性传播感染的检测和治疗；仅提供步入式服务',
    'No in-person visits available.': '不提供面对面访问。',
    'This health center only sees people who are living with HIV.':
      '此健康中心仅接待艾滋病病毒感染者。',
    'COVID-19 vaccines and testing are available to everyone. For all other services, this health center only sees people who are immigrants, undocumented, or who speak Spanish.':
      'COVID-19疫苗接种和检测面向所有人。 对于其他所有服务，此健康中心仅接待移民、无证人员或讲西班牙语的人。',
    'Telehealth appointments for established patients only. New patient telehealth appointments available only for patients starting Hep C treatment.':
      '远程医疗预约仅适用于已确诊患者。新的患者远程医疗预约仅适用于开始丙型肝炎治疗的患者。',
    'New patients should call on the first Wednesday of the month to make an appointment.':
      '新患者应在每月的第一个星期三致电进行预约。',
    'The pharmacy is currently closed for construction': '该药房目前已关闭施工。',
    'Services only offered for patients ages 14+': '仅向 14 岁以上的患者提供服务',
  },
  exceptions: {
    'Open first and third Saturday of each month': '每月第一个和第三个星期六开放',
    'Patients seen by appointment only from 4:30 p.m. - 8 p.m.':
      '仅接待提前预约患者，就诊时间：下午4:30 - 傍晚8',
    'Telehealth visits only': '仅限远程医疗访问',
    'On first Wednesday of the month, clinic opens at 1 p.m.': '每月第一个星期三，诊所下午1点开放',
    'Open until 8 p.m. by appointment only ': '开放至晚8点，但必须提前预约',
    'Closed noon - 1 p.m.': '中午休息时间：中午12点 - 下午1点',
    'Closed at noon for lunch': '中午休息，供应午餐',
    'Urgent care available from 10:30 a.m. - 2 p.m.': '紧急护理：上午10:30 - 下午2点',
    'On second Friday of the month, clinic closes at 1 p.m.':
      '每月第二个星期五，诊所于下午1点关闭。',
    'On second Saturday of the month, clinic is open from 10 a.m. to 2 p.m. ':
      '每月第二个星期六，诊所开放时间为上午10点至下午2点。',
    'Patients seen by appointment only until 7:30 p.m. on the first and third Thursdays of the month':
      '患者只能在每月的第一个和第三个星期四晚上 7:30 之前预约看病',
    'Open first and third Thursday of each month from 5 p.m. - 7:30 p.m. (appointment only)':
      '每月第一个和第三个星期四下午 5 点至晚上 7:30 开放（仅限预约）',
    'Open on second Saturday of the month': '每月第二个星期六开放',
    'Telehealth available 5 p.m. - 7 p.m.': '下午 5 点至晚上 7 点提供远程医疗服务',
    'Closes at noon on the third Thursday of every month, Telehealth available 5 p.m. - 7 p.m.':
      '每月第三个星期四中午关闭，远程医疗于下午5点至晚上7点开放。',
    'Dental available 8:30 a.m. - 1 p.m. every third Saturday':
      '牙科每周三上午 8:30 至下午 1 点提供牙科服务',
    'Open every fourth Saturday of the month for primary care and podiatry':
      '每月第四个星期六开放初级保健和足病治疗',
    'Open 8:30 a.m. - 1 p.m. every second and fourth Saturday of the month':
      '每月第二和第四个星期六上午 8:30 至下午 1 点开放',
    'Dental and pediatric services available 8:30 a.m. - 1 p.m. every second and fourth Saturday of the month':
      '每月第二和第四个星期六上午 8:30 至下午 1 点提供牙科和儿科服务',
    'Open 8:30 a.m. - 12 p.m. every third Friday of the month':
      '每月第三个星期五上午 8:30-中午 12 点开放',
    'Open 8:30 a.m. - 12 p.m. every third Saturday of the month':
      '每月第三个星期六上午 8:30-中午 12 点开放',
    'On fourth Friday of the month, clinic opens from 10 a.m. - 5 p.m.':
      '每月第四个星期五，诊所的营业时间为上午10点至下午5点。',
    'On fourth Friday of the month, clinic opens 10 a.m. - 5 p.m.':
      '每月第四个星期五，诊所的营业时间为上午10点至下午5点。',
    'Closed 4 p.m. - 5 p.m.': '下午 4 点-下午 5 点关闭',
    'Closes at 1 p.m. every second Friday of the month': '每月第二个星期五下午 1 点关闭',
    'Closes at noon on the third Thursday of every month': '每月第三个星期四中午关闭',
    'On 2nd and 4th Tuesday of the month, clinic is open from 7:30 a.m. - 8:00 p.m. ':
      '每月的第二个和第四个星期二，诊所的开放时间为上午 7:30 至晚上 8:00。',
    'On 2nd Thursday of the month, clinic is open from 9:00 a.m. - 5:00 p.m.':
      '每月的第二个星期四，诊所的开放时间为上午 9:00 至下午 5:00。',
    'On 2nd Friday of the month, clinic is open from 1:30 p.m. - 5:00 p.m.':
      '每月的第二个星期五，诊所的开放时间为下午 1:30 至下午 5:00。',
    'On second and fourth Saturday of the month, clinic is open from 8:30 a.m. - 1 p.m. for dental services':
      '每月的第二个和第四个星期六，诊所的营业时间为上午 8:30 至下午 1 点，提供牙科服务',
    'Evening telehealth services 5 p.m. - 8 p.m.': '晚间远程医疗服务下午 5 点-晚上 8 点',
    'Evening telehealth services available 5 p.m. - 8 p.m.': '晚间远程医疗服务下午 5 点-晚上 8 点',
    'Evening Telehealth service 5 p.m. to 7 p.m.': '晚间远程医疗服务下午 5 点-晚上 7 点',
    'Evening telehealth services 5 p.m. - 8 p.m. Open every fourth Saturday of the month for primary care and podiatry':
      '晚间远程医疗服务下午 5 点至晚上 8 点每隔一个月的第四个星期六开放，提供初级保健和足病治疗',
    'On third Thursday of the month, clinic is closed': '每月的第三个星期四，诊所关闭',
    'On second Friday of the month, clinic closes at noon': '每月的第二个星期五，诊所于中午关闭',
    'Open 5 p.m. - 8 p.m. by appointment only': '下午 5 点至晚上 8 点开放，仅限预约',
    'Select Saturdays by appointment only': '仅在某些星期六需要预约',
    'Open until 7 p.m. by appointment only ': '开放至晚上 7 点，仅限预约',
    'On first and third Thursday of the month, clinic is open until 7:30 p.m.':
      '每月的第一个和第三个星期四，诊所营业至晚上 7:30。',
    'Evening telehealth services available 5 p.m. - 6 p.m.':
      '下午 5 点至下午 6 点提供晚间远程医疗服务',
    'Dental services available 8:30 a.m. - 1 p.m.': '上午 8:30 至下午 1 点提供牙科服务',
    'Evening telehealth services available 5 p.m. - 7 p.m.':
      '下午 5 点至晚上 7 点提供晚间远程医疗服务',
    'Evening telehealth services 5 p.m. to 7 p.m.': '下午 5 点至晚上 7 点提供晚间远程医疗服务',
    'Open every first and third Saturday of the month': '每个月的第一个和第三个星期六开放',
    'Medical services are provided Thursday evenings only': '医疗服务仅在周四晚上提供',
    'On 2nd and 4th Saturday of the month, clinic is open from 7:00 a.m. - noon':
      '每月的第二个和第四个星期六，诊所的营业时间为上午7点至中午',
    'Every other Saturday, clinic is open by appointment only': '每隔一个星期六，诊所只接受预约',
    'On 2nd and 4th Saturday of the month, clinic is open from 8:30 a.m. - 1 p.m. for dental services':
      '每月的第二个和第四个星期六，诊所的开放时间为上午 8:30 至下午 1 点，提供牙科服务',
    'On 1st and 3rd Saturday of the month, clinic is open for dental services':
      '每月的第一个和第三个星期六，诊所开放牙科服务',
    'On 2nd Saturday of the month, clinic is open from 10 a.m. - 2 p.m.':
      '每月的第二个星期六，诊所的开放时间为上午10点至下午2点。',
    'Telehealth visits only from 9 a.m. - 3 p.m.': '仅在上午 9 点至下午 3 点之间进行远程医疗就诊',
  },
  closed: '休息',
  'closed*': '休息*',
  slidingScaleExplanation:
    '这是您将为定期就诊支付的费用。 您的费用取决于您的收入和家庭人数的具体情况。',
  share: '分享',
  results: '结果',
  outOf: '出来了',
  backToHome: '回到主页',
  back: '返回',
  currentLocation: '当前所在地',
  useCurrentLocation: '使用当前位置',
  searchBar: '搜索栏',
  searchButton: '“搜索” 按钮',
  otherLanguages: '如果您正在寻找其他语言，可以在地图的搜索栏中键入该语言',
  tableNoData: {
    noSpecializedServices: '该健康中心不提供任何仅限于儿童或成人的服务',
    noOtherServices: '该健康中心不提供任何其他服务',
    noHours: '目前尚不清楚这个健康中心的营业时间',
  },
}
