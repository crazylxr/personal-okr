import { databaseService } from './services/databaseService';

export async function seedDatabase() {
  try {
    // 检查是否已有数据
    const existingTodos = await databaseService.getTodos();
    const existingOKRs = await databaseService.getOKRs();
    
    if (existingTodos.length > 0 || existingOKRs.length > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    console.log('Seeding database with sample data...');

    // 创建示例 OKRs
    const okr1Id = await databaseService.createOKR({
      title: '提升个人效率',
      description: '通过优化工作流程和工具使用，提升个人工作效率',
      quarter: 'Q1',
      year: 2024,
      progress: 65,
      status: 'active'
    });

    const okr2Id = await databaseService.createOKR({
      title: '学习新技术',
      description: '掌握前端新技术栈，提升技术能力',
      quarter: 'Q1',
      year: 2024,
      progress: 30,
      status: 'active'
    });

    // 创建示例待办事项
    await databaseService.createTodo({
      title: '完成项目文档',
      description: '编写项目的技术文档和用户手册',
      priority: 'high',
      status: 'pending',
      due_date: '2024-02-15',
      tags: '工作,文档'
    });

    await databaseService.createTodo({
      title: '学习React 18新特性',
      description: '深入了解React 18的并发特性和Suspense',
      priority: 'medium',
      status: 'in_progress',
      tags: '学习,React'
    });

    await databaseService.createTodo({
      title: '整理代码仓库',
      description: '清理无用代码，优化项目结构',
      priority: 'low',
      status: 'completed',
      tags: '代码,优化'
    });

    await databaseService.createTodo({
      title: '准备技术分享',
      description: '准备下周的技术分享演讲',
      priority: 'high',
      status: 'pending',
      due_date: '2024-02-10',
      tags: '分享,演讲'
    });

    await databaseService.createTodo({
      title: '优化应用性能',
      description: '分析并优化应用的加载速度',
      priority: 'medium',
      status: 'pending',
      tags: '性能,优化'
    });

    // 创建示例任务
    await databaseService.createTask({
      okr_id: okr1Id,
      title: '建立时间管理系统',
      description: '使用番茄工作法和时间追踪工具',
      estimated_hours: 8,
      actual_hours: 5,
      priority: 'high',
      status: 'completed'
    });

    await databaseService.createTask({
      okr_id: okr1Id,
      title: '自动化重复任务',
      description: '编写脚本自动化日常重复工作',
      estimated_hours: 16,
      actual_hours: 10,
      priority: 'medium',
      status: 'in_progress'
    });

    await databaseService.createTask({
      okr_id: okr2Id,
      title: '学习TypeScript高级特性',
      description: '深入学习泛型、装饰器等高级特性',
      estimated_hours: 20,
      actual_hours: 0,
      priority: 'high',
      status: 'todo'
    });

    // 创建示例笔记
    await databaseService.createNote({
      title: '项目架构思考',
      content: '# 项目架构设计\n\n## 技术栈选择\n- Frontend: React + TypeScript\n- Backend: Electron\n- Database: SQLite\n\n## 核心功能\n1. 待办事项管理\n2. OKR目标追踪\n3. 任务时间管理',
      tags: '架构,设计'
    });

    await databaseService.createNote({
      title: 'React 18 学习笔记',
      content: '# React 18 新特性\n\n## Concurrent Features\n- Automatic Batching\n- Transitions\n- Suspense improvements\n\n## 升级注意事项\n- createRoot API\n- StrictMode 变化',
      tags: '学习,React'
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}