import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  LawFirm,
  Contract,
  ContractTemplate,
  FeeAgreement,
  ServiceEvaluation,
  ContractStatistics,
  LawFirmStatistics,
  ContractQueryCondition,
  LawFirmQueryCondition
} from '@/types/contract';

export const useContractStore = defineStore('contract', () => {
  // 状态
  const lawFirms = ref<LawFirm[]>([]);
  const contracts = ref<Contract[]>([]);
  const contractTemplates = ref<ContractTemplate[]>([]);
  const feeAgreements = ref<FeeAgreement[]>([]);
  const serviceEvaluations = ref<ServiceEvaluation[]>([]);
  const loading = ref(false);

  // 计算属性
  const activeContracts = computed(() => 
    contracts.value.filter(contract => contract.status === 'active')
  );

  const activeLawFirms = computed(() => 
    lawFirms.value.filter(firm => firm.status === 'active')
  );

  const activeTemplates = computed(() => 
    contractTemplates.value.filter(template => template.status === 'active')
  );

  const pendingPayments = computed(() => 
    feeAgreements.value.filter(agreement => agreement.status === 'pending')
  );

  const overduePayments = computed(() => 
    feeAgreements.value.filter(agreement => agreement.status === 'overdue')
  );

  // 统计计算
  const contractStatistics = computed((): ContractStatistics => {
    const totalContracts = contracts.value.length;
    const activeContracts = contracts.value.filter(c => c.status === 'active').length;
    const completedContracts = contracts.value.filter(c => c.status === 'completed').length;
    const totalValue = contracts.value.reduce((sum, c) => sum + c.value, 0);
    
    const contractsByType = contracts.value.reduce((acc, contract) => {
      acc[contract.type] = (acc[contract.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const contractsByStatus = contracts.value.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLawFirms = lawFirms.value
      .map(firm => ({
        id: firm.id,
        name: firm.name,
        contractCount: contracts.value.filter(c => c.lawFirmId === firm.id).length,
        revenue: firm.totalRevenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const averageRating = lawFirms.value.length > 0 
      ? lawFirms.value.reduce((sum, firm) => sum + firm.rating, 0) / lawFirms.value.length 
      : 0;

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      totalValue,
      averageRating,
      topLawFirms,
      contractsByType,
      contractsByStatus
    };
  });

  const lawFirmStatistics = computed((): LawFirmStatistics => {
    const totalLawFirms = lawFirms.value.length;
    const activeLawFirms = lawFirms.value.filter(f => f.status === 'active').length;
    const totalRevenue = lawFirms.value.reduce((sum, firm) => sum + firm.totalRevenue, 0);
    
    const averageRating = lawFirms.value.length > 0 
      ? lawFirms.value.reduce((sum, firm) => sum + firm.rating, 0) / lawFirms.value.length 
      : 0;

    const specialties = lawFirms.value.flatMap(firm => firm.specialties);
    const specialtyCount = specialties.reduce((acc, specialty) => {
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSpecialties = Object.entries(specialtyCount)
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const lawFirmsByServiceLevel = lawFirms.value.reduce((acc, firm) => {
      acc[firm.serviceLevel] = (acc[firm.serviceLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLawFirms,
      activeLawFirms,
      averageRating,
      totalRevenue,
      topSpecialties,
      lawFirmsByServiceLevel
    };
  });

  // 方法
  const loadFromStorage = () => {
    try {
      const storedLawFirms = localStorage.getItem('contract_lawFirms');
      if (storedLawFirms) {
        lawFirms.value = JSON.parse(storedLawFirms);
      } else {
        lawFirms.value = generateSampleLawFirms();
        saveLawFirmsToStorage();
      }

      const storedContracts = localStorage.getItem('contract_contracts');
      if (storedContracts) {
        contracts.value = JSON.parse(storedContracts);
      } else {
        contracts.value = generateSampleContracts();
        saveContractsToStorage();
      }

      const storedTemplates = localStorage.getItem('contract_templates');
      if (storedTemplates) {
        contractTemplates.value = JSON.parse(storedTemplates);
      } else {
        contractTemplates.value = generateSampleTemplates();
        saveTemplatesToStorage();
      }

      const storedFeeAgreements = localStorage.getItem('contract_feeAgreements');
      if (storedFeeAgreements) {
        feeAgreements.value = JSON.parse(storedFeeAgreements);
      } else {
        feeAgreements.value = generateSampleFeeAgreements();
        saveFeeAgreementsToStorage();
      }

      const storedEvaluations = localStorage.getItem('contract_evaluations');
      if (storedEvaluations) {
        serviceEvaluations.value = JSON.parse(storedEvaluations);
      } else {
        serviceEvaluations.value = generateSampleEvaluations();
        saveEvaluationsToStorage();
      }
    } catch (error) {
      console.error('加载合同数据失败:', error);
    }
  };

  const saveToStorage = () => {
    saveLawFirmsToStorage();
    saveContractsToStorage();
    saveTemplatesToStorage();
    saveFeeAgreementsToStorage();
    saveEvaluationsToStorage();
  };

  const saveLawFirmsToStorage = () => {
    localStorage.setItem('contract_lawFirms', JSON.stringify(lawFirms.value));
  };

  const saveContractsToStorage = () => {
    localStorage.setItem('contract_contracts', JSON.stringify(contracts.value));
  };

  const saveTemplatesToStorage = () => {
    localStorage.setItem('contract_templates', JSON.stringify(contractTemplates.value));
  };

  const saveFeeAgreementsToStorage = () => {
    localStorage.setItem('contract_feeAgreements', JSON.stringify(feeAgreements.value));
  };

  const saveEvaluationsToStorage = () => {
    localStorage.setItem('contract_evaluations', JSON.stringify(serviceEvaluations.value));
  };

  // 律师事务所管理
  const addLawFirm = (lawFirm: Omit<LawFirm, 'id' | 'createdAt' | 'updatedAt'>): LawFirm => {
    const newLawFirm: LawFirm = {
      ...lawFirm,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    lawFirms.value.push(newLawFirm);
    saveLawFirmsToStorage();
    return newLawFirm;
  };

  const updateLawFirm = (id: number, updates: Partial<LawFirm>) => {
    const index = lawFirms.value.findIndex(firm => firm.id === id);
    if (index !== -1) {
      lawFirms.value[index] = {
        ...lawFirms.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveLawFirmsToStorage();
    }
  };

  const deleteLawFirm = (id: number) => {
    const index = lawFirms.value.findIndex(firm => firm.id === id);
    if (index !== -1) {
      lawFirms.value.splice(index, 1);
      saveLawFirmsToStorage();
    }
  };

  // 合同管理
  const addContract = (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Contract => {
    const newContract: Contract = {
      ...contract,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    contracts.value.push(newContract);
    saveContractsToStorage();
    return newContract;
  };

  const updateContract = (id: number, updates: Partial<Contract>) => {
    const index = contracts.value.findIndex(contract => contract.id === id);
    if (index !== -1) {
      contracts.value[index] = {
        ...contracts.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveContractsToStorage();
    }
  };

  const deleteContract = (id: number) => {
    const index = contracts.value.findIndex(contract => contract.id === id);
    if (index !== -1) {
      contracts.value.splice(index, 1);
      saveContractsToStorage();
    }
  };

  // 合同模板管理
  const addTemplate = (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>): ContractTemplate => {
    const newTemplate: ContractTemplate = {
      ...template,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    contractTemplates.value.push(newTemplate);
    saveTemplatesToStorage();
    return newTemplate;
  };

  const updateTemplate = (id: number, updates: Partial<ContractTemplate>) => {
    const index = contractTemplates.value.findIndex(template => template.id === id);
    if (index !== -1) {
      contractTemplates.value[index] = {
        ...contractTemplates.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveTemplatesToStorage();
    }
  };

  const deleteTemplate = (id: number) => {
    const index = contractTemplates.value.findIndex(template => template.id === id);
    if (index !== -1) {
      contractTemplates.value.splice(index, 1);
      saveTemplatesToStorage();
    }
  };

  // 费用协议管理
  const addFeeAgreement = (agreement: Omit<FeeAgreement, 'id' | 'createdAt' | 'updatedAt'>): FeeAgreement => {
    const newAgreement: FeeAgreement = {
      ...agreement,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    feeAgreements.value.push(newAgreement);
    saveFeeAgreementsToStorage();
    return newAgreement;
  };

  const updateFeeAgreement = (id: number, updates: Partial<FeeAgreement>) => {
    const index = feeAgreements.value.findIndex(agreement => agreement.id === id);
    if (index !== -1) {
      feeAgreements.value[index] = {
        ...feeAgreements.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveFeeAgreementsToStorage();
    }
  };

  const deleteFeeAgreement = (id: number) => {
    const index = feeAgreements.value.findIndex(agreement => agreement.id === id);
    if (index !== -1) {
      feeAgreements.value.splice(index, 1);
      saveFeeAgreementsToStorage();
    }
  };

  // 服务质量评估管理
  const addEvaluation = (evaluation: Omit<ServiceEvaluation, 'id' | 'createdAt' | 'updatedAt'>): ServiceEvaluation => {
    const newEvaluation: ServiceEvaluation = {
      ...evaluation,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    serviceEvaluations.value.push(newEvaluation);
    saveEvaluationsToStorage();
    return newEvaluation;
  };

  const updateEvaluation = (id: number, updates: Partial<ServiceEvaluation>) => {
    const index = serviceEvaluations.value.findIndex(evaluation => evaluation.id === id);
    if (index !== -1) {
      serviceEvaluations.value[index] = {
        ...serviceEvaluations.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveEvaluationsToStorage();
    }
  };

  const deleteEvaluation = (id: number) => {
    const index = serviceEvaluations.value.findIndex(evaluation => evaluation.id === id);
    if (index !== -1) {
      serviceEvaluations.value.splice(index, 1);
      saveEvaluationsToStorage();
    }
  };

  // 查询方法
  const queryContracts = (condition: ContractQueryCondition): Contract[] => {
    return contracts.value.filter(contract => {
      if (condition.status && contract.status !== condition.status) return false;
      if (condition.type && contract.type !== condition.type) return false;
      if (condition.lawFirmId && contract.lawFirmId !== condition.lawFirmId) return false;
      if (condition.clientId && contract.clientId !== condition.clientId) return false;
      if (condition.keyword && !contract.title.toLowerCase().includes(condition.keyword.toLowerCase())) return false;
      return true;
    });
  };

  const queryLawFirms = (condition: LawFirmQueryCondition): LawFirm[] => {
    return lawFirms.value.filter(firm => {
      if (condition.status && firm.status !== condition.status) return false;
      if (condition.serviceLevel && firm.serviceLevel !== condition.serviceLevel) return false;
      if (condition.specialty && !firm.specialties.includes(condition.specialty)) return false;
      if (condition.keyword && !firm.name.toLowerCase().includes(condition.keyword.toLowerCase())) return false;
      return true;
    });
  };

  // 生成示例数据
  const generateSampleLawFirms = (): LawFirm[] => {
    return [
      {
        id: 1,
        name: '北京知识产权律师事务所',
        contactPerson: '张律师',
        phone: '010-12345678',
        email: 'zhang@lawfirm.com',
        address: '北京市朝阳区建国门外大街1号',
        specialties: ['专利', '商标', '版权'],
        serviceLevel: 'premium',
        status: 'active',
        rating: 4.8,
        contractCount: 15,
        totalRevenue: 2500000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: '上海科技法律事务所',
        contactPerson: '李律师',
        phone: '021-87654321',
        email: 'li@techlaw.com',
        address: '上海市浦东新区陆家嘴环路1000号',
        specialties: ['专利', '技术转让'],
        serviceLevel: 'standard',
        status: 'active',
        rating: 4.5,
        contractCount: 8,
        totalRevenue: 1200000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: '深圳创新知识产权事务所',
        contactPerson: '王律师',
        phone: '0755-12345678',
        email: 'wang@innovation.com',
        address: '深圳市南山区科技园南区',
        specialties: ['专利', '商业秘密'],
        serviceLevel: 'premium',
        status: 'active',
        rating: 4.9,
        contractCount: 12,
        totalRevenue: 1800000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  };

  const generateSampleContracts = (): Contract[] => {
    return [
      {
        id: 1,
        title: '专利申请代理合同',
        contractNumber: 'CT-2024-001',
        type: 'patent_application',
        lawFirmId: 1,
        clientId: 1,
        templateId: 1,
        status: 'active',
        priority: 'high',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        value: 50000,
        currency: 'CNY',
        description: '人工智能相关专利申请代理服务',
        terms: '标准专利申请代理条款',
        attachments: ['contract_001.pdf'],
        createdBy: 1,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 2,
        title: '商标注册代理合同',
        contractNumber: 'CT-2024-002',
        type: 'trademark',
        lawFirmId: 1,
        clientId: 2,
        templateId: 2,
        status: 'active',
        priority: 'medium',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        value: 30000,
        currency: 'CNY',
        description: '品牌商标注册代理服务',
        terms: '商标注册代理标准条款',
        attachments: ['contract_002.pdf'],
        createdBy: 1,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z'
      }
    ];
  };

  const generateSampleTemplates = (): ContractTemplate[] => {
    return [
      {
        id: 1,
        name: '专利申请代理标准合同',
        type: 'patent_application',
        description: '标准专利申请代理合同模板',
        content: '甲方：{client_name}\n乙方：{law_firm_name}\n服务内容：专利申请代理...',
        variables: ['client_name', 'law_firm_name', 'patent_title'],
        status: 'active',
        version: '1.0',
        createdBy: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: '商标注册代理标准合同',
        type: 'trademark',
        description: '标准商标注册代理合同模板',
        content: '甲方：{client_name}\n乙方：{law_firm_name}\n服务内容：商标注册代理...',
        variables: ['client_name', 'law_firm_name', 'trademark_name'],
        status: 'active',
        version: '1.0',
        createdBy: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  };

  const generateSampleFeeAgreements = (): FeeAgreement[] => {
    return [
      {
        id: 1,
        lawFirmId: 1,
        contractId: 1,
        feeType: 'fixed',
        amount: 50000,
        currency: 'CNY',
        paymentTerms: '签订合同时支付50%，完成申请时支付50%',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        status: 'pending',
        paidAmount: 25000,
        lastPaymentDate: '2024-01-15',
        nextPaymentDate: '2024-06-30',
        description: '专利申请代理费用协议',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ];
  };

  const generateSampleEvaluations = (): ServiceEvaluation[] => {
    return [
      {
        id: 1,
        lawFirmId: 1,
        contractId: 1,
        evaluatorId: 1,
        evaluationDate: '2024-06-15',
        criteria: {
          responsiveness: 4.5,
          quality: 4.8,
          communication: 4.6,
          timeliness: 4.7,
          cost_efficiency: 4.4
        },
        overallScore: 4.6,
        comments: '服务专业，响应及时，质量优秀',
        recommendations: '继续保持高质量服务',
        status: 'completed',
        createdAt: '2024-06-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z'
      }
    ];
  };

  return {
    // 状态
    lawFirms,
    contracts,
    contractTemplates,
    feeAgreements,
    serviceEvaluations,
    loading,
    
    // 计算属性
    activeContracts,
    activeLawFirms,
    activeTemplates,
    pendingPayments,
    overduePayments,
    contractStatistics,
    lawFirmStatistics,
    
    // 方法
    loadFromStorage,
    saveToStorage,
    
    // 律师事务所管理
    addLawFirm,
    updateLawFirm,
    deleteLawFirm,
    
    // 合同管理
    addContract,
    updateContract,
    deleteContract,
    
    // 合同模板管理
    addTemplate,
    updateTemplate,
    deleteTemplate,
    
    // 费用协议管理
    addFeeAgreement,
    updateFeeAgreement,
    deleteFeeAgreement,
    
    // 服务质量评估管理
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    
    // 查询方法
    queryContracts,
    queryLawFirms
  };
}); 