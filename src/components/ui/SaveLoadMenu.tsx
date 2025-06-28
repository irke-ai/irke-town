'use client'

import { useState, useEffect } from 'react'
import { TownStorage } from '@/lib/townStorage'
import { SavedTown } from '@/types/town'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'

export default function SaveLoadMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [saves, setSaves] = useState<SavedTown[]>([])
  const [saveName, setSaveName] = useState('')
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save')
  
  const buildings = useBuildingStore((state) => state.buildings)
  const connections = useBuildingStore((state) => state.connections)
  const editMode = useUIStore((state) => state.editMode)
  
  // 저장 목록 새로고침
  const refreshSaves = () => {
    setSaves(TownStorage.getAllSaves())
  }
  
  useEffect(() => {
    if (isOpen) {
      refreshSaves()
    }
  }, [isOpen])
  
  // 타운 저장
  const handleSave = () => {
    if (!saveName.trim()) {
      alert('저장할 이름을 입력해주세요.')
      return
    }
    
    const id = TownStorage.saveTown(saveName, buildings, connections)
    TownStorage.setCurrentSession(id)
    
    setSaveName('')
    refreshSaves()
    alert('저장되었습니다!')
  }
  
  // 타운 불러오기
  const handleLoad = (id: string) => {
    const town = TownStorage.loadTown(id)
    if (!town) {
      alert('불러오기 실패')
      return
    }
    
    // 스토어 초기화
    const store = useBuildingStore.getState()
    
    // 기존 데이터 삭제
    buildings.forEach(b => store.removeBuilding(b.id))
    connections.forEach(c => store.removeConnection(c.id))
    
    // 새 데이터 로드 - buildings는 이미 완전한 객체이므로 직접 설정
    useBuildingStore.setState({ buildings: town.buildings })
    
    // 연결은 직접 설정 (addConnection은 경로를 다시 계산하므로)
    useBuildingStore.setState({ connections: town.connections })
    
    TownStorage.setCurrentSession(id)
    setIsOpen(false)
    alert('불러오기 완료!')
  }
  
  // 타운 삭제
  const handleDelete = (id: string) => {
    if (confirm('정말로 삭제하시겠습니까?')) {
      TownStorage.deleteTown(id)
      refreshSaves()
    }
  }
  
  // 편집 모드에서만 표시
  if (editMode !== 'edit') return null
  
  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-100"
        title="저장/불러오기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">저장/불러오기</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {/* 탭 */}
          <div className="flex mb-4 border-b">
            <button
              onClick={() => setActiveTab('save')}
              className={`px-4 py-2 ${activeTab === 'save' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              저장
            </button>
            <button
              onClick={() => setActiveTab('load')}
              className={`px-4 py-2 ${activeTab === 'load' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              불러오기
            </button>
          </div>
          
          {activeTab === 'save' ? (
            <div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="저장할 이름"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-60">
              {saves.length === 0 ? (
                <p className="text-gray-500 text-center py-4">저장된 타운이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {saves.map((save) => (
                    <div
                      key={save.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{save.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(save.updatedAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleLoad(save.id)}
                          className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          불러오기
                        </button>
                        <button
                          onClick={() => handleDelete(save.id)}
                          className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}