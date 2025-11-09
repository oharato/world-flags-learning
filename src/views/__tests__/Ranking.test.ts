import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useRankingStore } from '../../store/ranking';
import Ranking from '../Ranking.vue';

describe('Ranking.vue', () => {
  let router: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/ranking', component: Ranking },
      ],
    });

    // ストアをリセット
    const rankingStore = useRankingStore();
    rankingStore.$reset();
  });

  it('正しくマウントされる', async () => {
    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('h2').text()).toBe('ランキング');
  });

  it('地域選択ドロップダウンが表示される', async () => {
    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    // RegionSelectorコンポーネントが存在することを確認
    expect(wrapper.findComponent({ name: 'RegionSelector' }).exists()).toBe(true);
  });

  it('表示タイプ選択ドロップダウンが表示される', async () => {
    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    const select = wrapper.find('select#type');
    expect(select.exists()).toBe(true);

    const options = select.findAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]?.attributes('value')).toBe('daily');
    expect(options[1]?.attributes('value')).toBe('all_time');
  });

  it('クイズ形式選択ドロップダウンが表示される', async () => {
    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    // QuizFormatSelectorコンポーネントが存在することを確認
    expect(wrapper.findComponent({ name: 'QuizFormatSelector' }).exists()).toBe(true);
  });

  it('ランキングデータがある場合、テーブルが表示される', async () => {
    const rankingStore = useRankingStore();
    rankingStore.ranking = [
      {
        rank: 1,
        nickname: 'テストユーザー1',
        score: 100,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        rank: 2,
        nickname: 'テストユーザー2',
        score: 90,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];
    rankingStore.loading = false;
    rankingStore.error = null;

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    // デスクトップ版テーブルを確認
    const table = wrapper.find('table');
    expect(table.exists()).toBe(true);

    const rows = table.findAll('tbody tr');
    expect(rows).toHaveLength(2);
  });

  it('ローディング中はスピナーが表示される', async () => {
    const rankingStore = useRankingStore();
    rankingStore.loading = true;
    rankingStore.ranking = [];
    rankingStore.error = null;

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true);
  });

  it('エラーがある場合、エラーメッセージが表示される', async () => {
    const rankingStore = useRankingStore();
    rankingStore.loading = false;
    rankingStore.ranking = [];
    rankingStore.error = 'データの取得に失敗しました';

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.findComponent({ name: 'ErrorMessage' }).exists()).toBe(true);
  });

  it('ランキングデータがない場合、メッセージが表示される', async () => {
    const rankingStore = useRankingStore();
    rankingStore.loading = false;
    rankingStore.ranking = [];
    rankingStore.error = null;

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('まだランキングデータがありません。');
  });

  it('トップ3には適切なメダルアイコンが表示される', async () => {
    const rankingStore = useRankingStore();
    rankingStore.ranking = [
      {
        rank: 1,
        nickname: '金メダル',
        score: 100,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        rank: 2,
        nickname: '銀メダル',
        score: 90,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        rank: 3,
        nickname: '銅メダル',
        score: 80,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        rank: 4,
        nickname: '4位',
        score: 70,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];
    rankingStore.loading = false;
    rankingStore.error = null;

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]?.text()).toContain('🥇');
    expect(rows[1]?.text()).toContain('🥈');
    expect(rows[2]?.text()).toContain('🥉');
    expect(rows[3]?.text()).toContain('4');
  });

  it('自分のランクがハイライトされる', async () => {
    const rankingStore = useRankingStore();
    rankingStore.ranking = [
      {
        rank: 1,
        nickname: 'テストユーザー1',
        score: 100,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        rank: 2,
        nickname: '自分',
        score: 90,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];
    rankingStore.myRank = {
      rank: 2,
      nickname: '自分',
      score: 90,
      created_at: '2024-01-01T00:00:00.000Z',
    };
    rankingStore.loading = false;
    rankingStore.error = null;

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]?.classes()).not.toContain('bg-yellow-200');
    expect(rows[1]?.classes()).toContain('bg-yellow-200');
  });

  it('URLパラメータから初期値を読み込む', async () => {
    await router.push('/ranking?region=Asia&type=all_time&format=name-to-flag');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    // selectedRegion, selectedType, selectedFormatの値を確認
    expect((wrapper.vm as any).selectedRegion).toBe('Asia');
    expect((wrapper.vm as any).selectedType).toBe('all_time');
    expect((wrapper.vm as any).selectedFormat).toBe('name-to-flag');
  });

  it('選択が変更されたらURLパラメータが更新される', async () => {
    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    const typeSelect = wrapper.find('select#type');
    await typeSelect.setValue('all_time');

    // watcherが実行されるまで待つ
    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.type).toBe('all_time');
    });
  });

  it('アンマウント時にmyRankがクリアされる', async () => {
    const rankingStore = useRankingStore();
    rankingStore.myRank = {
      rank: 1,
      nickname: 'テスト',
      score: 100,
      created_at: '2024-01-01T00:00:00.000Z',
    };

    await router.push('/ranking');
    await router.isReady();

    const wrapper = mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    expect(rankingStore.myRank).not.toBeNull();

    wrapper.unmount();

    expect(rankingStore.myRank).toBeNull();
  });

  it('fetchRankingが正しいパラメータで呼ばれる', async () => {
    const rankingStore = useRankingStore();
    const fetchRankingSpy = vi.spyOn(rankingStore, 'fetchRanking');

    await router.push('/ranking?region=Europe&type=daily&format=flag-to-name');
    await router.isReady();

    mount(Ranking, {
      global: {
        plugins: [router],
      },
    });

    await vi.waitFor(() => {
      expect(fetchRankingSpy).toHaveBeenCalledWith('Europe', 'daily', 'flag-to-name');
    });
  });
});
