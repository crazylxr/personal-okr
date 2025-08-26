import React, { useEffect, useMemo } from 'react';
import { CheckIcon, TargetIcon, CheckCircledIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { useDataStore } from '../stores/dataStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const { todos, okrs, loading, loadTodos, loadOKRs, updateTodo } = useDataStore();
  const { toast } = useToast();

  useEffect(() => {
    loadTodos();
    loadOKRs();
  }, [loadTodos, loadOKRs]);

  const stats = useMemo(() => {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.status === 'completed').length;
    const activeOKRs = okrs.filter(okr => okr.status === 'active').length;
    const averageProgress = activeOKRs > 0 
      ? Math.round(okrs.filter(okr => okr.status === 'active').reduce((sum, okr) => sum + okr.progress, 0) / activeOKRs)
      : 0;
    
    return {
      totalTodos,
      completedTodos,
      activeOKRs,
      averageProgress
    };
  }, [todos, okrs]);

  const todayTodos = useMemo(() => {
    const today = new Date().toDateString();
    return todos.filter(todo => {
      if (!todo.created_at) return false;
      const todoDate = new Date(todo.created_at).toDateString();
      return todoDate === today;
    }).slice(0, 5);
  }, [todos]);

  const activeOKRs = useMemo(() => {
    return okrs.filter(okr => okr.status === 'active').slice(0, 3);
  }, [okrs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">仪表板</h1>
        <p className="text-gray-600 dark:text-gray-400">欢迎回来！这里是您的工作概览</p>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">总待办事项</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTodos}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+{todayTodos.length} 今日新增</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">已完成</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircledIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTodos}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">完成率 {stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}%</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">活跃 OKR</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TargetIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeOKRs}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">本季度目标</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">平均进度</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <ActivityLogIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageProgress}%</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">OKR 完成度</p>
          </CardContent>
        </Card>
      </div>

      {/* 内容区域网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今日待办 */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              今日待办
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTodos.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {todayTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Checkbox
                      checked={todo.status === 'completed'}
                      onCheckedChange={async (checked) => {
                        try {
                          const newStatus = checked ? 'completed' : 'pending';
                          await updateTodo(todo.id!, { status: newStatus });
                          toast({ 
                            title: '成功', 
                            description: checked ? '任务已完成' : '任务已重新激活' 
                          });
                        } catch (error) {
                          toast({ 
                            title: '错误', 
                            description: '状态更新失败', 
                            variant: 'destructive' 
                          });
                        }
                      }}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <span className={`flex-1 ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {todo.title}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      todo.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">今天没有待办事项</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">享受轻松的一天！</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OKR 进度 */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TargetIcon className="h-5 w-5 mr-2 text-purple-600" />
              OKR 进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOKRs.length > 0 ? (
              <div className="space-y-6 max-h-80 overflow-y-auto">
                {activeOKRs.map((okr) => (
                  <div key={okr.id} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">{okr.title}</h4>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 ml-2">{okr.progress}%</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={okr.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>进度</span>
                        <span>{okr.progress >= 70 ? '进展良好' : okr.progress >= 30 ? '正在推进' : '需要关注'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TargetIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">暂无活跃的 OKR</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">开始设定您的目标吧！</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;