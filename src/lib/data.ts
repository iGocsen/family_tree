export interface Person {
  id: string;
  name: string;
  generation: number;
  birthYear?: string;
  deathYear?: string;
  gender: 'male' | 'female';
  spouse?: string;
  children?: string[];
  parentId?: string;
  biography: string;
  achievements?: string[];
  notes?: string;
}

export interface Genealogy {
  id: string;
  name: string;
  description: string;
  origin: string;
  foundingYear: string;
  ancestor: Person;
  people: Record<string, Person>;
}

const buildPeople = (people: Person[]): Record<string, Person> => {
  const record: Record<string, Person> = {};
  people.forEach(p => { record[p.id] = p; });
  return record;
};

// ===== 李氏族谱 =====
const liPeople = buildPeople([
  { id: 'li-1', name: '李明德', generation: 1, birthYear: '1680', deathYear: '1752', gender: 'male', biography: '李氏一世祖，字光远，号德庵。清康熙年间自福建漳州迁居广东潮州，以耕读传家，开创李氏一脉。为人忠厚，乐善好施，乡里称颂。', achievements: ['迁居潮州，开基立业', '建立家族义学', '修桥铺路，造福乡里'], children: ['li-2a', 'li-2b'] },
  { id: 'li-2a', name: '李守仁', generation: 2, birthYear: '1705', deathYear: '1778', gender: 'male', biography: '二世祖，字德厚。继承父志，勤耕苦读，以孝义闻名乡里。', children: ['li-3a'], parentId: 'li-1' },
  { id: 'li-2b', name: '李守义', generation: 2, birthYear: '1710', deathYear: '1785', gender: 'male', biography: '二世祖，字德正。善经商，家道渐丰。', children: ['li-3b', 'li-3c'], parentId: 'li-1' },
  { id: 'li-3a', name: '李文远', generation: 3, birthYear: '1730', deathYear: '1802', gender: 'male', biography: '三世祖，字志远。乾隆年间中举人，曾任县学教谕，以教育后学为己任。', achievements: ['乾隆年间中举', '任县学教谕'], children: ['li-4a', 'li-4b'], parentId: 'li-2a' },
  { id: 'li-3b', name: '李文达', generation: 3, birthYear: '1735', deathYear: '1798', gender: 'male', biography: '三世祖，字通达。继承父业经商，家业日益兴隆。', children: ['li-4c'], parentId: 'li-2b' },
  { id: 'li-3c', name: '李文华', generation: 3, birthYear: '1740', deathYear: '1810', gender: 'male', biography: '三世祖，字华章。博学多才，善诗文。', children: ['li-4d'], parentId: 'li-2b' },
  { id: 'li-4a', name: '李国栋', generation: 4, birthYear: '1758', deathYear: '1830', gender: 'male', biography: '四世祖，字栋材。嘉庆年间进士，官至知府。', achievements: ['嘉庆年间进士', '官至知府'], children: ['li-5a'], parentId: 'li-3a' },
  { id: 'li-4b', name: '李国梁', generation: 4, birthYear: '1762', deathYear: '1825', gender: 'male', biography: '四世祖，字栋梁。以教书为生，门生众多。', children: ['li-5b', 'li-5c'], parentId: 'li-3a' },
  { id: 'li-4c', name: '李国才', generation: 4, birthYear: '1760', deathYear: '1828', gender: 'male', biography: '四世祖，字才俊。经商有道，富甲一方。', children: ['li-5d'], parentId: 'li-3b' },
  { id: 'li-4d', name: '李国华', generation: 4, birthYear: '1768', deathYear: '1835', gender: 'male', biography: '四世祖，字华实。文武双全，曾参与平定地方动乱。', children: ['li-5e'], parentId: 'li-3c' },
  { id: 'li-5a', name: '李承恩', generation: 5, birthYear: '1785', deathYear: '1855', gender: 'male', biography: '五世祖，字恩泽。道光年间举人，历任多职，政绩卓著。', achievements: ['道光年间举人', '政绩卓著'], children: ['li-6a', 'li-6b'], parentId: 'li-4a' },
  { id: 'li-5b', name: '李承志', generation: 5, birthYear: '1790', deathYear: '1860', gender: 'male', biography: '五世祖，字志学。继承父业，教书育人。', children: ['li-6c'], parentId: 'li-4b' },
  { id: 'li-5c', name: '李承业', generation: 5, birthYear: '1795', deathYear: '1865', gender: 'male', biography: '五世祖，字业勤。经营家业，兼修医术。', children: ['li-6d'], parentId: 'li-4b' },
  { id: 'li-5d', name: '李承富', generation: 5, birthYear: '1788', deathYear: '1858', gender: 'male', biography: '五世祖，字富源。经商致富，乐善好施。', children: ['li-6e'], parentId: 'li-4c' },
  { id: 'li-5e', name: '李承武', generation: 5, birthYear: '1792', deathYear: '1862', gender: 'male', biography: '五世祖，字武威。习武从军，官至千总。', achievements: ['官至千总'], children: ['li-6f'], parentId: 'li-4d' },
  { id: 'li-6a', name: '李兴邦', generation: 6, birthYear: '1815', deathYear: '1885', gender: 'male', biography: '六世祖，字邦兴。咸丰年间进士，官至道台。', achievements: ['咸丰年间进士', '官至道台'], children: ['li-7a'], parentId: 'li-5a' },
  { id: 'li-6b', name: '李兴家', generation: 6, birthYear: '1820', deathYear: '1890', gender: 'male', biography: '六世祖，字家旺。经营田产，家道中兴。', children: ['li-7b', 'li-7c'], parentId: 'li-5a' },
  { id: 'li-6c', name: '李兴学', generation: 6, birthYear: '1818', deathYear: '1888', gender: 'male', biography: '六世祖，字学勤。创办私塾，培育人才。', children: ['li-7d'], parentId: 'li-5b' },
  { id: 'li-6d', name: '李兴业', generation: 6, birthYear: '1825', deathYear: '1895', gender: 'male', biography: '六世祖，字业广。继承医道，悬壶济世。', children: ['li-7e'], parentId: 'li-5c' },
  { id: 'li-6e', name: '李兴隆', generation: 6, birthYear: '1812', deathYear: '1882', gender: 'male', biography: '六世祖，字隆盛。经商有道，开设多家商号。', children: ['li-7f'], parentId: 'li-5d' },
  { id: 'li-6f', name: '李兴武', generation: 6, birthYear: '1822', deathYear: '1892', gender: 'male', biography: '六世祖，字武威。继承父志，从军报国。', children: ['li-7g'], parentId: 'li-5e' },
  { id: 'li-7a', name: '李绍先', generation: 7, birthYear: '1845', deathYear: '1915', gender: 'male', biography: '七世祖，字先锋。清末秀才，后投身新学，倡导教育改革。', achievements: ['倡导教育改革', '创办新式学堂'], children: ['li-8a', 'li-8b'], parentId: 'li-6a' },
  { id: 'li-7b', name: '李绍宗', generation: 7, birthYear: '1850', deathYear: '1920', gender: 'male', biography: '七世祖，字宗法。管理族务，修订族谱。', children: ['li-8c'], parentId: 'li-6b' },
  { id: 'li-7c', name: '李绍祖', generation: 7, birthYear: '1855', deathYear: '1925', gender: 'male', biography: '七世祖，字祖德。经营家业，兼修水利。', children: ['li-8d'], parentId: 'li-6b' },
  { id: 'li-7d', name: '李绍文', generation: 7, birthYear: '1848', deathYear: '1918', gender: 'male', biography: '七世祖，字文光。继承教育事业，门生遍布。', children: ['li-8e'], parentId: 'li-6c' },
  { id: 'li-7e', name: '李绍医', generation: 7, birthYear: '1852', deathYear: '1922', gender: 'male', biography: '七世祖，字医明。精通中医，远近闻名。', children: ['li-8f'], parentId: 'li-6d' },
  { id: 'li-7f', name: '李绍商', generation: 7, birthYear: '1842', deathYear: '1912', gender: 'male', biography: '七世祖，字商达。拓展商业，涉足海外贸易。', children: ['li-8g'], parentId: 'li-6e' },
  { id: 'li-7g', name: '李绍武', generation: 7, birthYear: '1858', deathYear: '1928', gender: 'male', biography: '七世祖，字武略。清末武举，后参与辛亥革命。', achievements: ['清末武举', '参与辛亥革命'], children: ['li-8h'], parentId: 'li-6f' },
  { id: 'li-8a', name: '李德明', generation: 8, birthYear: '1875', deathYear: '1945', gender: 'male', biography: '八世祖，字明德。留学日本，回国后从事教育工作，曾任中学校长。', achievements: ['留学日本', '任中学校长'], children: ['li-9a', 'li-9b'], parentId: 'li-7a' },
  { id: 'li-8b', name: '李德辉', generation: 8, birthYear: '1880', deathYear: '1950', gender: 'male', biography: '八世祖，字辉光。投身实业，创办纺织厂。', achievements: ['创办纺织厂'], children: ['li-9c'], parentId: 'li-7a' },
  { id: 'li-8c', name: '李德厚', generation: 8, birthYear: '1878', deathYear: '1948', gender: 'male', biography: '八世祖，字厚德。管理族产，主持修谱。', children: ['li-9d'], parentId: 'li-7b' },
  { id: 'li-8d', name: '李德泽', generation: 8, birthYear: '1885', deathYear: '1955', gender: 'male', biography: '八世祖，字泽润。兴修水利，造福桑梓。', children: ['li-9e'], parentId: 'li-7c' },
  { id: 'li-8e', name: '李德文', generation: 8, birthYear: '1872', deathYear: '1942', gender: 'male', biography: '八世祖，字文远。继承教育传统，著书立说。', achievements: ['著书立说'], children: ['li-9f'], parentId: 'li-7d' },
  { id: 'li-8f', name: '李德医', generation: 8, birthYear: '1882', deathYear: '1952', gender: 'male', biography: '八世祖，字医道。中西医兼修，开办诊所。', children: ['li-9g'], parentId: 'li-7e' },
  { id: 'li-8g', name: '李德商', generation: 8, birthYear: '1870', deathYear: '1940', gender: 'male', biography: '八世祖，字商通。继承家业，商业版图扩展至东南亚。', children: ['li-9h'], parentId: 'li-7f' },
  { id: 'li-8h', name: '李德武', generation: 8, birthYear: '1888', deathYear: '1958', gender: 'male', biography: '八世祖，字武烈。参加北伐战争，后解甲归田。', achievements: ['参加北伐战争'], children: ['li-9i'], parentId: 'li-7g' },
  { id: 'li-9a', name: '李志远', generation: 9, birthYear: '1905', deathYear: '1985', gender: 'male', biography: '九世，字远行。早年参加革命，新中国成立后从事文化工作。', achievements: ['参加革命', '从事文化工作'], parentId: 'li-8a' },
  { id: 'li-9b', name: '李志学', generation: 9, birthYear: '1910', deathYear: '1990', gender: 'male', biography: '九世，字学海。大学教授，专攻历史学。', achievements: ['大学教授', '历史学家'], parentId: 'li-8a' },
  { id: 'li-9c', name: '李志工', generation: 9, birthYear: '1915', deathYear: '1995', gender: 'male', biography: '九世，字工匠。工程师，参与多项国家重点工程建设。', achievements: ['参与国家重点工程'], parentId: 'li-8b' },
  { id: 'li-9d', name: '李志农', generation: 9, birthYear: '1908', deathYear: '1988', gender: 'male', biography: '九世，字农丰。农业专家，推广现代农业技术。', achievements: ['农业专家'], parentId: 'li-8c' },
  { id: 'li-9e', name: '李志水', generation: 9, birthYear: '1918', deathYear: '2000', gender: 'male', biography: '九世，字水利。水利工程师，主持多项水利工程。', achievements: ['水利工程师'], parentId: 'li-8d' },
  { id: 'li-9f', name: '李志文', generation: 9, birthYear: '1902', deathYear: '1982', gender: 'male', biography: '九世，字文华。作家、诗人，著有文集多部。', achievements: ['作家', '诗人'], parentId: 'li-8e' },
  { id: 'li-9g', name: '李志医', generation: 9, birthYear: '1912', deathYear: '1992', gender: 'male', biography: '九世，字医圣。著名中医，曾任中医院院长。', achievements: ['中医院院长'], parentId: 'li-8f' },
  { id: 'li-9h', name: '李志商', generation: 9, birthYear: '1900', deathYear: '1980', gender: 'male', biography: '九世，字商海。实业家，创办多家企业。', achievements: ['实业家'], parentId: 'li-8g' },
  { id: 'li-9i', name: '李志军', generation: 9, birthYear: '1920', deathYear: '2005', gender: 'male', biography: '九世，字军威。军人出身，参加过抗日战争和解放战争，后转业地方工作。', achievements: ['参加抗日战争', '参加解放战争'], parentId: 'li-8h' },
]);

// ===== 张氏族谱 =====
const zhangPeople = buildPeople([
  { id: 'zhang-1', name: '张文远', generation: 1, birthYear: '1690', deathYear: '1760', gender: 'male', biography: '张氏一世祖，字致远。清康熙末年自江西迁居湖南长沙，以耕读为业，开创张氏基业。', achievements: ['迁居长沙，开基立业', '建立宗祠'], children: ['zhang-2a', 'zhang-2b'] },
  { id: 'zhang-2a', name: '张守正', generation: 2, birthYear: '1715', deathYear: '1788', gender: 'male', biography: '二世祖，字正心。继承父业，勤于耕作。', children: ['zhang-3a'], parentId: 'zhang-1' },
  { id: 'zhang-2b', name: '张守道', generation: 2, birthYear: '1720', deathYear: '1795', gender: 'male', biography: '二世祖，字道明。习武从军，官至百户。', children: ['zhang-3b', 'zhang-3c'], parentId: 'zhang-1' },
  { id: 'zhang-3a', name: '张德兴', generation: 3, birthYear: '1745', deathYear: '1815', gender: 'male', biography: '三世祖，字兴邦。乾隆年间贡生，曾任训导。', achievements: ['乾隆年间贡生', '任训导'], children: ['zhang-4a', 'zhang-4b'], parentId: 'zhang-2a' },
  { id: 'zhang-3b', name: '张德武', generation: 3, birthYear: '1750', deathYear: '1820', gender: 'male', biography: '三世祖，字武威。继承父志，从军报国。', children: ['zhang-4c'], parentId: 'zhang-2b' },
  { id: 'zhang-3c', name: '张德文', generation: 3, birthYear: '1755', deathYear: '1825', gender: 'male', biography: '三世祖，字文华。博学多才，善书法。', children: ['zhang-4d'], parentId: 'zhang-2b' },
  { id: 'zhang-4a', name: '张承业', generation: 4, birthYear: '1775', deathYear: '1845', gender: 'male', biography: '四世祖，字业广。嘉庆年间举人，官至知县。', achievements: ['嘉庆年间举人', '官至知县'], children: ['zhang-5a'], parentId: 'zhang-3a' },
  { id: 'zhang-4b', name: '张承志', generation: 4, birthYear: '1780', deathYear: '1850', gender: 'male', biography: '四世祖，字志远。教书育人，门生众多。', children: ['zhang-5b', 'zhang-5c'], parentId: 'zhang-3a' },
  { id: 'zhang-4c', name: '张承武', generation: 4, birthYear: '1778', deathYear: '1848', gender: 'male', biography: '四世祖，字武略。武举出身，官至守备。', achievements: ['武举出身', '官至守备'], children: ['zhang-5d'], parentId: 'zhang-3b' },
  { id: 'zhang-4d', name: '张承文', generation: 4, birthYear: '1785', deathYear: '1855', gender: 'male', biography: '四世祖，字文光。书法家，作品流传至今。', achievements: ['著名书法家'], children: ['zhang-5e'], parentId: 'zhang-3c' },
  { id: 'zhang-5a', name: '张兴邦', generation: 5, birthYear: '1805', deathYear: '1875', gender: 'male', biography: '五世祖，字邦国。道光年间进士，官至知府。', achievements: ['道光年间进士', '官至知府'], children: ['zhang-6a', 'zhang-6b'], parentId: 'zhang-4a' },
  { id: 'zhang-5b', name: '张兴学', generation: 5, birthYear: '1810', deathYear: '1880', gender: 'male', biography: '五世祖，字学海。创办书院，培育人才。', achievements: ['创办书院'], children: ['zhang-6c'], parentId: 'zhang-4b' },
  { id: 'zhang-5c', name: '张兴业', generation: 5, birthYear: '1815', deathYear: '1885', gender: 'male', biography: '五世祖，字业勤。经营家业，兼修医术。', children: ['zhang-6d'], parentId: 'zhang-4b' },
  { id: 'zhang-5d', name: '张兴武', generation: 5, birthYear: '1808', deathYear: '1878', gender: 'male', biography: '五世祖，字武威。继承父志，从军报国。', children: ['zhang-6e'], parentId: 'zhang-4c' },
  { id: 'zhang-5e', name: '张兴文', generation: 5, birthYear: '1818', deathYear: '1888', gender: 'male', biography: '五世祖，字文远。书画双绝，名扬四海。', achievements: ['书画双绝'], children: ['zhang-6f'], parentId: 'zhang-4d' },
  { id: 'zhang-6a', name: '张绍先', generation: 6, birthYear: '1835', deathYear: '1905', gender: 'male', biography: '六世祖，字先锋。咸丰年间举人，后投身洋务运动。', achievements: ['咸丰年间举人', '投身洋务运动'], children: ['zhang-7a'], parentId: 'zhang-5a' },
  { id: 'zhang-6b', name: '张绍宗', generation: 6, birthYear: '1840', deathYear: '1910', gender: 'male', biography: '六世祖，字宗法。管理族务，主持修谱。', children: ['zhang-7b', 'zhang-7c'], parentId: 'zhang-5a' },
  { id: 'zhang-6c', name: '张绍文', generation: 6, birthYear: '1838', deathYear: '1908', gender: 'male', biography: '六世祖，字文光。继承教育事业，桃李满天下。', children: ['zhang-7d'], parentId: 'zhang-5b' },
  { id: 'zhang-6d', name: '张绍医', generation: 6, birthYear: '1845', deathYear: '1915', gender: 'male', biography: '六世祖，字医明。精通医术，远近闻名。', children: ['zhang-7e'], parentId: 'zhang-5c' },
  { id: 'zhang-6e', name: '张绍武', generation: 6, birthYear: '1832', deathYear: '1902', gender: 'male', biography: '六世祖，字武威。参加太平天国战争，后解甲归田。', achievements: ['参加太平天国战争'], children: ['zhang-7f'], parentId: 'zhang-5d' },
  { id: 'zhang-6f', name: '张绍艺', generation: 6, birthYear: '1848', deathYear: '1918', gender: 'male', biography: '六世祖，字艺精。书画名家，作品被多家博物馆收藏。', achievements: ['书画名家'], children: ['zhang-7g'], parentId: 'zhang-5e' },
  { id: 'zhang-7a', name: '张德明', generation: 7, birthYear: '1865', deathYear: '1935', gender: 'male', biography: '七世祖，字明德。留学英国，回国后从事外交工作。', achievements: ['留学英国', '外交官'], children: ['zhang-8a', 'zhang-8b'], parentId: 'zhang-6a' },
  { id: 'zhang-7b', name: '张德厚', generation: 7, birthYear: '1870', deathYear: '1940', gender: 'male', biography: '七世祖，字厚德。管理族产，热心公益。', children: ['zhang-8c'], parentId: 'zhang-6b' },
  { id: 'zhang-7c', name: '张德泽', generation: 7, birthYear: '1875', deathYear: '1945', gender: 'male', biography: '七世祖，字泽润。兴办实业，造福桑梓。', children: ['zhang-8d'], parentId: 'zhang-6b' },
  { id: 'zhang-7d', name: '张德文', generation: 7, birthYear: '1868', deathYear: '1938', gender: 'male', biography: '七世祖，字文远。大学教授，专攻文学。', achievements: ['大学教授'], children: ['zhang-8e'], parentId: 'zhang-6c' },
  { id: 'zhang-7e', name: '张德医', generation: 7, birthYear: '1878', deathYear: '1948', gender: 'male', biography: '七世祖，字医道。中西医兼修，开办医院。', achievements: ['开办医院'], children: ['zhang-8f'], parentId: 'zhang-6d' },
  { id: 'zhang-7f', name: '张德武', generation: 7, birthYear: '1862', deathYear: '1932', gender: 'male', biography: '七世祖，字武烈。参加辛亥革命，后从商。', achievements: ['参加辛亥革命'], children: ['zhang-8g'], parentId: 'zhang-6e' },
  { id: 'zhang-7g', name: '张德艺', generation: 7, birthYear: '1880', deathYear: '1950', gender: 'male', biography: '七世祖，字艺海。继承父业，书画造诣深厚。', achievements: ['书画造诣深厚'], children: ['zhang-8h'], parentId: 'zhang-6f' },
  { id: 'zhang-8a', name: '张志明', generation: 8, birthYear: '1895', deathYear: '1965', gender: 'male', biography: '八世，字明达。外交官，曾任驻外大使。', achievements: ['驻外大使'], children: ['zhang-9a', 'zhang-9b'], parentId: 'zhang-7a' },
  { id: 'zhang-8b', name: '张志辉', generation: 8, birthYear: '1900', deathYear: '1970', gender: 'male', biography: '八世，字辉光。科学家，参与两弹一星工程。', achievements: ['参与两弹一星工程'], children: ['zhang-9c'], parentId: 'zhang-7a' },
  { id: 'zhang-8c', name: '张志厚', generation: 8, birthYear: '1898', deathYear: '1968', gender: 'male', biography: '八世，字厚德。企业家，创办多家工厂。', achievements: ['企业家'], children: ['zhang-9d'], parentId: 'zhang-7b' },
  { id: 'zhang-8d', name: '张志泽', generation: 8, birthYear: '1905', deathYear: '1975', gender: 'male', biography: '八世，字泽润。水利专家，主持三峡前期勘测。', achievements: ['水利专家'], children: ['zhang-9e'], parentId: 'zhang-7c' },
  { id: 'zhang-8e', name: '张志文', generation: 8, birthYear: '1892', deathYear: '1962', gender: 'male', biography: '八世，字文华。文学家，著有小说多部。', achievements: ['文学家'], children: ['zhang-9f'], parentId: 'zhang-7d' },
  { id: 'zhang-8f', name: '张志医', generation: 8, birthYear: '1908', deathYear: '1978', gender: 'male', biography: '八世，字医道。著名外科医生，曾任医院院长。', achievements: ['著名外科医生'], children: ['zhang-9g'], parentId: 'zhang-7e' },
  { id: 'zhang-8g', name: '张志武', generation: 8, birthYear: '1890', deathYear: '1960', gender: 'male', biography: '八世，字武威。军人，参加过抗日战争。', achievements: ['参加抗日战争'], children: ['zhang-9h'], parentId: 'zhang-7f' },
  { id: 'zhang-8h', name: '张志艺', generation: 8, birthYear: '1910', deathYear: '1980', gender: 'male', biography: '八世，字艺海。国画大师，作品享誉海内外。', achievements: ['国画大师'], children: ['zhang-9i'], parentId: 'zhang-7g' },
  { id: 'zhang-9a', name: '张建国', generation: 9, birthYear: '1925', deathYear: '2005', gender: 'male', biography: '九世，字国安。外交官，曾任外交部司长。', achievements: ['外交部司长'], parentId: 'zhang-8a' },
  { id: 'zhang-9b', name: '张建华', generation: 9, birthYear: '1930', deathYear: '2010', gender: 'male', biography: '九世，字华章。物理学家，中国科学院院士。', achievements: ['中国科学院院士', '物理学家'], parentId: 'zhang-8a' },
  { id: 'zhang-9c', name: '张建军', generation: 9, birthYear: '1928', deathYear: '2008', gender: 'male', biography: '九世，字军威。航天工程师，参与神舟飞船设计。', achievements: ['航天工程师'], parentId: 'zhang-8b' },
  { id: 'zhang-9d', name: '张建农', generation: 9, birthYear: '1922', deathYear: '2002', gender: 'male', biography: '九世，字农丰。农业科学家，杂交水稻研究先驱。', achievements: ['农业科学家'], parentId: 'zhang-8c' },
  { id: 'zhang-9e', name: '张建水', generation: 9, birthYear: '1935', deathYear: '2015', gender: 'male', biography: '九世，字水利。水利工程师，参与南水北调工程。', achievements: ['参与南水北调工程'], parentId: 'zhang-8d' },
  { id: 'zhang-9f', name: '张建文', generation: 9, birthYear: '1920', deathYear: '2000', gender: 'male', biography: '九世，字文华。著名作家，茅盾文学奖获得者。', achievements: ['茅盾文学奖获得者'], parentId: 'zhang-8e' },
  { id: 'zhang-9g', name: '张建医', generation: 9, birthYear: '1938', deathYear: '2018', gender: 'male', biography: '九世，字医道。著名医学专家，中国工程院院士。', achievements: ['中国工程院院士'], parentId: 'zhang-8f' },
  { id: 'zhang-9h', name: '张建武', generation: 9, birthYear: '1918', deathYear: '1998', gender: 'male', biography: '九世，字武威。军人，参加过解放战争和抗美援朝。', achievements: ['参加解放战争', '参加抗美援朝'], parentId: 'zhang-8g' },
  { id: 'zhang-9i', name: '张建艺', generation: 9, birthYear: '1940', deathYear: '2020', gender: 'male', biography: '九世，字艺海。当代著名画家，作品被国家美术馆收藏。', achievements: ['当代著名画家'], parentId: 'zhang-8h' },
]);

// ===== 陈氏族谱 =====
const chenPeople = buildPeople([
  { id: 'chen-1', name: '陈德安', generation: 1, birthYear: '1700', deathYear: '1770', gender: 'male', biography: '陈氏一世祖，字安之。清康熙年间自河南迁居四川成都，以农桑为本，开创陈氏基业。', achievements: ['迁居成都，开基立业', '建立家族祠堂'], children: ['chen-2a', 'chen-2b'] },
  { id: 'chen-2a', name: '陈守业', generation: 2, birthYear: '1725', deathYear: '1798', gender: 'male', biography: '二世祖，字业勤。继承父业，勤于农桑。', children: ['chen-3a'], parentId: 'chen-1' },
  { id: 'chen-2b', name: '陈守学', generation: 2, birthYear: '1730', deathYear: '1805', gender: 'male', biography: '二世祖，字学勤。勤奋好学，以教书为生。', children: ['chen-3b', 'chen-3c'], parentId: 'chen-1' },
  { id: 'chen-3a', name: '陈兴农', generation: 3, birthYear: '1755', deathYear: '1828', gender: 'male', biography: '三世祖，字农丰。改良农具，推广先进耕作技术。', achievements: ['改良农具', '推广先进耕作技术'], children: ['chen-4a', 'chen-4b'], parentId: 'chen-2a' },
  { id: 'chen-3b', name: '陈兴文', generation: 3, birthYear: '1760', deathYear: '1835', gender: 'male', biography: '三世祖，字文华。乾隆年间举人，官至教谕。', achievements: ['乾隆年间举人', '官至教谕'], children: ['chen-4c'], parentId: 'chen-2b' },
  { id: 'chen-3c', name: '陈兴商', generation: 3, birthYear: '1765', deathYear: '1840', gender: 'male', biography: '三世祖，字商达。经商有道，家业日丰。', children: ['chen-4d'], parentId: 'chen-2b' },
  { id: 'chen-4a', name: '陈承富', generation: 4, birthYear: '1785', deathYear: '1858', gender: 'male', biography: '四世祖，字富源。继承父业，农业经营有方。', children: ['chen-5a'], parentId: 'chen-3a' },
  { id: 'chen-4b', name: '陈承贵', generation: 4, birthYear: '1790', deathYear: '1865', gender: 'male', biography: '四世祖，字贵安。经营茶园，名扬川蜀。', achievements: ['经营茶园'], children: ['chen-5b', 'chen-5c'], parentId: 'chen-3a' },
  { id: 'chen-4c', name: '陈承文', generation: 4, birthYear: '1788', deathYear: '1860', gender: 'male', biography: '四世祖，字文远。嘉庆年间进士，官至知县。', achievements: ['嘉庆年间进士', '官至知县'], children: ['chen-5d'], parentId: 'chen-3b' },
  { id: 'chen-4d', name: '陈承商', generation: 4, birthYear: '1795', deathYear: '1868', gender: 'male', biography: '四世祖，字商通。继承父业，商业版图扩展至西南。', children: ['chen-5e'], parentId: 'chen-3c' },
  { id: 'chen-5a', name: '陈德田', generation: 5, birthYear: '1815', deathYear: '1888', gender: 'male', biography: '五世祖，字田丰。农业专家，推广水稻新品种。', achievements: ['推广水稻新品种'], children: ['chen-6a'], parentId: 'chen-4a' },
  { id: 'chen-5b', name: '陈德茶', generation: 5, birthYear: '1820', deathYear: '1895', gender: 'male', biography: '五世祖，字茶香。茶叶专家，创制名茶。', achievements: ['创制名茶'], children: ['chen-6b', 'chen-6c'], parentId: 'chen-4b' },
  { id: 'chen-5c', name: '陈德林', generation: 5, birthYear: '1825', deathYear: '1900', gender: 'male', biography: '五世祖，字林茂。经营林木，绿化荒山。', children: ['chen-6d'], parentId: 'chen-4b' },
  { id: 'chen-5d', name: '陈德政', generation: 5, birthYear: '1818', deathYear: '1890', gender: 'male', biography: '五世祖，字政清。道光年间进士，官至知府。', achievements: ['道光年间进士', '官至知府'], children: ['chen-6e'], parentId: 'chen-4c' },
  { id: 'chen-5e', name: '陈德商', generation: 5, birthYear: '1828', deathYear: '1902', gender: 'male', biography: '五世祖，字商海。商业巨子，创办多家商号。', achievements: ['商业巨子'], children: ['chen-6f'], parentId: 'chen-4d' },
  { id: 'chen-6a', name: '陈绍农', generation: 6, birthYear: '1845', deathYear: '1918', gender: 'male', biography: '六世祖，字农新。引进西方农业技术，推动农业近代化。', achievements: ['引进西方农业技术'], children: ['chen-7a'], parentId: 'chen-5a' },
  { id: 'chen-6b', name: '陈绍茶', generation: 6, birthYear: '1850', deathYear: '1925', gender: 'male', biography: '六世祖，字茶圣。茶叶专家，作品获巴拿马万国博览会金奖。', achievements: ['巴拿马万国博览会金奖'], children: ['chen-7b'], parentId: 'chen-5b' },
  { id: 'chen-6c', name: '陈绍林', generation: 6, birthYear: '1855', deathYear: '1930', gender: 'male', biography: '六世祖，字林深。林业专家，创办林场。', achievements: ['创办林场'], children: ['chen-7c'], parentId: 'chen-5b' },
  { id: 'chen-6d', name: '陈绍山', generation: 6, birthYear: '1852', deathYear: '1928', gender: 'male', biography: '六世祖，字山高。继承父业，经营林木。', children: ['chen-7d'], parentId: 'chen-5c' },
  { id: 'chen-6e', name: '陈绍政', generation: 6, birthYear: '1848', deathYear: '1922', gender: 'male', biography: '六世祖，字政明。清末官员，参与新政改革。', achievements: ['参与新政改革'], children: ['chen-7e'], parentId: 'chen-5d' },
  { id: 'chen-6f', name: '陈绍商', generation: 6, birthYear: '1858', deathYear: '1935', gender: 'male', biography: '六世祖，字商达。继承家业，涉足金融。', achievements: ['涉足金融'], children: ['chen-7f'], parentId: 'chen-5e' },
  { id: 'chen-7a', name: '陈德新', generation: 7, birthYear: '1875', deathYear: '1948', gender: 'male', biography: '七世祖，字新学。留学美国，回国后从事农业教育。', achievements: ['留学美国', '农业教育家'], children: ['chen-8a', 'chen-8b'], parentId: 'chen-6a' },
  { id: 'chen-7b', name: '陈德茗', generation: 7, birthYear: '1880', deathYear: '1955', gender: 'male', biography: '七世祖，字茗香。茶叶专家，创办茶叶公司。', achievements: ['创办茶叶公司'], children: ['chen-8c'], parentId: 'chen-6b' },
  { id: 'chen-7c', name: '陈德森', generation: 7, birthYear: '1885', deathYear: '1960', gender: 'male', biography: '七世祖，字森林。林业专家，参与国家森林公园建设。', achievements: ['林业专家'], children: ['chen-8d'], parentId: 'chen-6c' },
  { id: 'chen-7d', name: '陈德岳', generation: 7, birthYear: '1882', deathYear: '1958', gender: 'male', biography: '七世祖，字岳峰。继承父业，经营林木。', children: ['chen-8e'], parentId: 'chen-6d' },
  { id: 'chen-7e', name: '陈德治', generation: 7, birthYear: '1878', deathYear: '1952', gender: 'male', biography: '七世祖，字治国。民国时期官员，曾任省长。', achievements: ['曾任省长'], children: ['chen-8f'], parentId: 'chen-6e' },
  { id: 'chen-7f', name: '陈德银', generation: 7, birthYear: '1888', deathYear: '1965', gender: 'male', biography: '七世祖，字银通。银行家，创办多家银行。', achievements: ['银行家'], children: ['chen-8g'], parentId: 'chen-6f' },
  { id: 'chen-8a', name: '陈志农', generation: 8, birthYear: '1905', deathYear: '1978', gender: 'male', biography: '八世，字农科。农业科学家，中国科学院院士。', achievements: ['中国科学院院士', '农业科学家'], children: ['chen-9a', 'chen-9b'], parentId: 'chen-7a' },
  { id: 'chen-8b', name: '陈志教', generation: 8, birthYear: '1910', deathYear: '1985', gender: 'male', biography: '八世，字教育。教育家，曾任大学校长。', achievements: ['大学校长'], children: ['chen-9c'], parentId: 'chen-7a' },
  { id: 'chen-8c', name: '陈志茶', generation: 8, birthYear: '1908', deathYear: '1982', gender: 'male', biography: '八世，字茶香。茶叶企业家，将中国茶推向世界。', achievements: ['茶叶企业家'], children: ['chen-9d'], parentId: 'chen-7b' },
  { id: 'chen-8d', name: '陈志林', generation: 8, birthYear: '1915', deathYear: '1990', gender: 'male', biography: '八世，字林茂。林业科学家，中国工程院院士。', achievements: ['中国工程院院士'], children: ['chen-9e'], parentId: 'chen-7c' },
  { id: 'chen-8e', name: '陈志峰', generation: 8, birthYear: '1912', deathYear: '1988', gender: 'male', biography: '八世，字峰高。继承父业，经营林业。', children: ['chen-9f'], parentId: 'chen-7d' },
  { id: 'chen-8f', name: '陈志国', generation: 8, birthYear: '1902', deathYear: '1975', gender: 'male', biography: '八世，字国安。政治家，曾任部长。', achievements: ['曾任部长'], children: ['chen-9g'], parentId: 'chen-7e' },
  { id: 'chen-8g', name: '陈志金', generation: 8, birthYear: '1918', deathYear: '1995', gender: 'male', biography: '八世，字金融。金融家，曾任银行行长。', achievements: ['银行行长'], children: ['chen-9h'], parentId: 'chen-7f' },
  { id: 'chen-9a', name: '陈建华', generation: 9, birthYear: '1935', deathYear: '2015', gender: 'male', biography: '九世，字华农。农业科学家，杂交水稻研究专家。', achievements: ['杂交水稻研究专家'], parentId: 'chen-8a' },
  { id: 'chen-9b', name: '陈建业', generation: 9, birthYear: '1940', deathYear: '2020', gender: 'male', biography: '九世，字业勤。农业企业家，创办农业科技公司。', achievements: ['农业企业家'], parentId: 'chen-8a' },
  { id: 'chen-9c', name: '陈建学', generation: 9, birthYear: '1938', deathYear: '2018', gender: 'male', biography: '九世，字学海。教育家，曾任教育部司长。', achievements: ['教育部司长'], parentId: 'chen-8b' },
  { id: 'chen-9d', name: '陈建茗', generation: 9, birthYear: '1932', deathYear: '2012', gender: 'male', biography: '九世，字茗远。茶叶企业家，国际茶文化推广者。', achievements: ['国际茶文化推广者'], parentId: 'chen-8c' },
  { id: 'chen-9e', name: '陈建森', generation: 9, birthYear: '1945', deathYear: '2025', gender: 'male', biography: '九世，字森林。林业科学家，致力于生态保护研究。', achievements: ['生态保护研究'], parentId: 'chen-8d' },
  { id: 'chen-9f', name: '陈建峰', generation: 9, birthYear: '1942', deathYear: '2022', gender: 'male', biography: '九世，字峰远。企业家，经营林业产业。', achievements: ['林业产业企业家'], parentId: 'chen-8e' },
  { id: 'chen-9g', name: '陈建国', generation: 9, birthYear: '1930', deathYear: '2010', gender: 'male', biography: '九世，字国安。外交官，曾任驻外大使。', achievements: ['驻外大使'], parentId: 'chen-8f' },
  { id: 'chen-9h', name: '陈建金', generation: 9, birthYear: '1948', deathYear: '2028', gender: 'male', biography: '九世，字金融。金融学家，曾任证监会副主席。', achievements: ['证监会副主席'], parentId: 'chen-8g' },
]);

// Export base genealogies for HomePage display
export const genealogies: Genealogy[] = [
  { id: 'li', name: '李氏族谱', description: '李氏一族自清康熙年间由福建漳州迁居广东潮州，以耕读传家，历经九代，枝繁叶茂。族中人才辈出，涵盖仕宦、教育、商业、医学等诸多领域。', origin: '福建漳州 → 广东潮州', foundingYear: '1680', ancestor: liPeople['li-1'], people: liPeople },
  { id: 'zhang', name: '张氏族谱', description: '张氏一族自清康熙末年自江西迁居湖南长沙，以耕读为业。九代传承，族中涌现众多杰出人物，涵盖外交、科学、文学、艺术、医学等领域。', origin: '江西 → 湖南长沙', foundingYear: '1690', ancestor: zhangPeople['zhang-1'], people: zhangPeople },
  { id: 'chen', name: '陈氏族谱', description: '陈氏一族自清康熙年间自河南迁居四川成都，以农桑为本。九代传承，族中人才辈出，涵盖农业、茶叶、林业、政治、金融等诸多领域。', origin: '河南 → 四川成都', foundingYear: '1700', ancestor: chenPeople['chen-1'], people: chenPeople },
];

// Cache for merged genealogies
let mergedCache: Record<string, { genealogy: Genealogy; timestamp: number }> = {};

/**
 * Get genealogy with approved new persons merged in.
 * Reads from localStorage for approved persons and merges them into the base data.
 */
export function getGenealogy(id: string): Genealogy | undefined {
  const base = genealogies.find(g => g.id === id);
  if (!base) return undefined;

  // Check cache (5 second TTL)
  const cached = mergedCache[id];
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.genealogy;
  }

  // Read approved persons from localStorage
  let approvedPersons: any[] = [];
  try {
    const data = localStorage.getItem('genealogy_new_persons');
    if (data) {
      approvedPersons = JSON.parse(data).filter((p: any) => p.genealogyId === id && p.status === 'approved');
    }
  } catch {
    // ignore
  }

  if (approvedPersons.length === 0) {
    mergedCache[id] = { genealogy: base, timestamp: Date.now() };
    return base;
  }

  // Merge approved persons into the people record
  const mergedPeople = { ...base.people };
  for (const ap of approvedPersons) {
    const person: Person = {
      id: ap.id,
      name: ap.name,
      generation: ap.generation,
      birthYear: ap.birthYear || undefined,
      deathYear: ap.deathYear || undefined,
      gender: ap.gender,
      spouse: ap.spouse || undefined,
      parentId: ap.parentId || undefined,
      biography: ap.biography,
      achievements: ap.achievements ? ap.achievements.split('\n').filter((a: string) => a.trim()) : undefined,
    };
    mergedPeople[ap.id] = person;
  }

  const merged: Genealogy = {
    ...base,
    people: mergedPeople,
  };

  mergedCache[id] = { genealogy: merged, timestamp: Date.now() };
  return merged;
}

export function searchPerson(genealogyId: string, query: string): Person[] {
  const genealogy = getGenealogy(genealogyId);
  if (!genealogy) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.values(genealogy.people).filter(p => p.name.toLowerCase().includes(q));
}

export function getPerson(genealogyId: string, personId: string): Person | undefined {
  const genealogy = getGenealogy(genealogyId);
  return genealogy?.people[personId];
}

export function getRootPerson(genealogyId: string): Person | undefined {
  const genealogy = getGenealogy(genealogyId);
  if (!genealogy) return undefined;
  return Object.values(genealogy.people).find(p => p.generation === 1);
}

export function getChildren(genealogyId: string, parentId: string): Person[] {
  const genealogy = getGenealogy(genealogyId);
  if (!genealogy) return [];
  return Object.values(genealogy.people).filter(p => p.parentId === parentId);
}

/**
 * Get ancestor chain from a person up to the root
 * Returns [root, ..., grandparent, parent, person]
 */
export function getAncestorChain(genealogyId: string, personId: string): Person[] {
  const genealogy = getGenealogy(genealogyId);
  if (!genealogy) return [];
  const chain: Person[] = [];
  let current = genealogy.people[personId];
  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    current = genealogy.people[current.parentId];
  }
  return chain;
}

/**
 * Get all descendants of a person (recursive)
 */
export function getDescendants(genealogyId: string, personId: string, maxDepth?: number, currentDepth: number = 0): Person[] {
  const children = getChildren(genealogyId, personId);
  if (maxDepth !== undefined && currentDepth >= maxDepth) return [];
  const result: Person[] = [];
  for (const child of children) {
    result.push(child);
    result.push(...getDescendants(genealogyId, child.id, maxDepth, currentDepth + 1));
  }
  return result;
}

/**
 * Get persons by generation
 */
export function getPersonsByGeneration(genealogyId: string, generation: number): Person[] {
  const genealogy = getGenealogy(genealogyId);
  if (!genealogy) return [];
  return Object.values(genealogy.people).filter(p => p.generation === generation);
}

/**
 * Build tree roots for rendering.
 * Given a selected person, find the ancestor at minGen, then return that ancestor
 * and all their siblings (same parent) at minGen.
 */
export function getTreeRoots(genealogyId: string, selectedPerson: Person, minGen: number, maxGen: number): Person[] {
  const genealogy = getGenealogy(genealogyId);
  if (!genealogy) return [];

  const chain = getAncestorChain(genealogyId, selectedPerson.id);
  const ancestorAtMinGen = chain.find(p => p.generation === minGen);

  if (!ancestorAtMinGen) return [];

  if (minGen === 1) {
    return getPersonsByGeneration(genealogyId, 1);
  }

  const ancestorParentId = ancestorAtMinGen.parentId;
  if (ancestorParentId) {
    return getPersonsByGeneration(genealogyId, minGen).filter(p => p.parentId === ancestorParentId);
  }

  return [ancestorAtMinGen];
}
