//
//  SalesListView.swift
//  Ezcar24Business
//
//  Created by Shokhabbos Makhmudov on 20/11/2025.
//

import SwiftUI

struct SalesListView: View {
    @StateObject private var viewModel: SalesViewModel


    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    private let showNavigation: Bool
    
    init(showNavigation: Bool = true) {
        self.showNavigation = showNavigation
        let context = PersistenceController.shared.container.viewContext
        _viewModel = StateObject(wrappedValue: SalesViewModel(context: context))
    }
    
    var body: some View {
        if showNavigation {
            NavigationStack {
                content
            }
        } else {
            content
        }
    }
    
    var content: some View {
        ZStack {
                ColorTheme.background.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Search Bar
                    HStack {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(ColorTheme.secondaryText)
                            TextField("Search vehicle or buyer...", text: $viewModel.searchText)
                                .foregroundColor(ColorTheme.primaryText)
                        }
                        .padding(12)
                        .background(ColorTheme.secondaryBackground)
                        .cornerRadius(12)
                    }
                    .padding()
                    
                    if viewModel.saleItems.isEmpty {
                        EmptySalesView()
                    } else {
                        List {
                            ForEach(viewModel.saleItems) { item in
                                ZStack {
                                    if let vehicle = item.sale.vehicle {
                                        NavigationLink(destination: VehicleDetailView(vehicle: vehicle)) {
                                            EmptyView()
                                        }
                                        .opacity(0)
                                    }
                                    
                                    SaleCard(item: item)
                                }
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            }
                            .onDelete(perform: deleteItems)
                        }
                        .listStyle(.plain)
                        .refreshable {
                            if case .signedIn(let user) = sessionStore.status {
                                await cloudSyncManager.manualSync(user: user)
                                viewModel.fetchSales()
                            }
                        }
                    }
                }
            }
            .navigationTitle("Sales History")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: AddSaleView()) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(ColorTheme.primary)
                    }
                }
            }
        }
    private func deleteItems(at offsets: IndexSet) {
        for index in offsets {
            let sale = viewModel.saleItems[index].sale
            viewModel.deleteSale(sale)
        }
    }
}


struct SaleCard: View {
    let item: SaleItem
    
    var body: some View {
        VStack(spacing: 0) {
            // Header: Vehicle & Date
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.vehicleName)
                        .font(.headline)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "person.fill")
                            .font(.caption)
                        Text(item.buyerName)
                            .font(.caption)
                    }
                    .foregroundColor(ColorTheme.secondaryText)
                }
                
                Spacer()
                
                Text(item.saleDate, formatter: saleDateFormatter)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(ColorTheme.background)
                    .foregroundColor(ColorTheme.secondaryText)
                    .clipShape(Capsule())
            }
            .padding(16)
            
            Divider()
                .background(ColorTheme.background)
            
            // Financials Grid
            HStack(spacing: 0) {
                // Revenue
                FinancialColumn(
                    title: "Revenue",
                    amount: item.salePrice,
                    color: ColorTheme.primaryText
                )
                
                Divider()
                    .frame(height: 40)
                
                // Cost
                FinancialColumn(
                    title: "Cost",
                    amount: item.costPrice,
                    color: ColorTheme.secondaryText
                )
                
                Divider()
                    .frame(height: 40)
                
                // Profit
                FinancialColumn(
                    title: "Net Profit",
                    amount: item.netProfit,
                    color: item.netProfit >= 0 ? ColorTheme.success : ColorTheme.danger,
                    isBold: true
                )
            }
            .padding(.vertical, 12)
            .background(ColorTheme.secondaryBackground.opacity(0.5))
        }
        .background(ColorTheme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
    
    private var saleDateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM, h:mm a"
        return formatter
    }
}

struct FinancialColumn: View {
    let title: String
    let amount: Decimal
    let color: Color
    var isBold: Bool = false
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(ColorTheme.secondaryText)
            
            Text(amount.asCurrency())
                .font(.subheadline)
                .fontWeight(isBold ? .bold : .medium)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
    }
}

struct EmptySalesView: View {
    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "dollarsign.circle")
                .font(.system(size: 60))
                .foregroundColor(ColorTheme.secondaryText.opacity(0.3))
            
            Text("No Sales Yet")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(ColorTheme.primaryText)
            
            Text("Record your first sale to see profit analytics.")
                .font(.subheadline)
                .foregroundColor(ColorTheme.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Spacer()
        }
    }
}

struct SalesListView_Previews: PreviewProvider {
    static var previews: some View {
        SalesListView()
    }
}
